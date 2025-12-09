#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本 - 简单视觉检测模块
使用OpenCV进行基础的颜色检测和目标识别
"""

import cv2
import numpy as np
import time
import json
import logging
from pathlib import Path
import threading

try:
    from picamera import PiCamera
    from picamera.array import PiRGBArray
    PICAMERA_AVAILABLE = True
except ImportError:
    PICAMERA_AVAILABLE = False
    print("Warning: picamera not available, using OpenCV fallback")

class SimpleDetector:
    """简单检测器类"""
    
    def __init__(self, config_file=None, save_images=True):
        """初始化检测器"""
        self.setup_logging()
        self.save_images = save_images
        self.save_dir = Path("/tmp/detection_images")
        self.save_dir.mkdir(exist_ok=True)
        
        # 加载配置
        if config_file:
            self.load_config(config_file)
        else:
            self.load_default_config()
        
        # 初始化摄像头
        self.setup_camera()
        
        self.logger.info("简单检测器初始化完成")
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('SimpleDetector')
    
    def load_config(self, config_file):
        """加载配置文件"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.detection_config = config['color_detection']
                self.logger.info(f"检测配置加载成功: {config_file}")
        except Exception as e:
            self.logger.error(f"配置加载失败: {e}")
            self.load_default_config()
    
    def load_default_config(self):
        """加载默认配置"""
        self.detection_config = {
            'plant_lower_hsv': [35, 40, 40],   # 植物颜色下限
            'plant_upper_hsv': [85, 255, 255],  # 植物颜色上限
            'min_area': 500,                   # 最小面积
            'max_area': 10000,                 # 最大面积
            'dilation_kernel': 5,              # 膨胀核大小
            'erosion_kernel': 3                # 腐蚀核大小
        }
        self.logger.info("使用默认检测配置")
    
    def setup_camera(self):
        """设置摄像头"""
        if PICAMERA_AVAILABLE:
            try:
                self.camera = PiCamera()
                self.camera.resolution = (640, 480)
                self.camera.framerate = 30
                self.raw_capture = PiRGBArray(self.camera, size=(640, 480))
                self.logger.info("PiCamera初始化成功")
            except Exception as e:
                self.logger.error(f"PiCamera初始化失败: {e}")
                self.setup_opencv_camera()
        else:
            self.setup_opencv_camera()
    
    def setup_opencv_camera(self):
        """设置OpenCV摄像头"""
        try:
            self.camera = cv2.VideoCapture(0)
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            self.logger.info("OpenCV摄像头初始化成功")
        except Exception as e:
            self.logger.error(f"OpenCV摄像头初始化失败: {e}")
            self.camera = None
    
    def capture_image(self, save=True):
        """捕获图像"""
        try:
            if PICAMERA_AVAILABLE and hasattr(self, 'raw_capture'):
                # 使用PiCamera
                self.raw_capture.truncate(0)
                self.camera.capture(self.raw_capture, format='bgr')
                image = self.raw_capture.array
            else:
                # 使用OpenCV
                ret, image = self.camera.read()
                if not ret:
                    raise Exception("无法从摄像头读取图像")
            
            # 保存图像
            if save and self.save_images:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"capture_{timestamp}.jpg"
                filepath = self.save_dir / filename
                cv2.imwrite(str(filepath), image)
                self.logger.info(f"图像已保存: {filepath}")
            
            return image
            
        except Exception as e:
            self.logger.error(f"图像捕获失败: {e}")
            return None
    
    def detect_green_plants(self, image):
        """检测绿色植物"""
        try:
            # 转换为HSV色彩空间
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # 创建绿色植物掩码
            lower_green = np.array(self.detection_config['plant_lower_hsv'])
            upper_green = np.array(self.detection_config['plant_upper_hsv'])
            mask = cv2.inRange(hsv, lower_green, upper_green)
            
            # 形态学操作去噪
            kernel_dilation = np.ones((self.detection_config['dilation_kernel'], 
                                    self.detection_config['dilation_kernel']), np.uint8)
            kernel_erosion = np.ones((self.detection_config['erosion_kernel'], 
                                   self.detection_config['erosion_kernel']), np.uint8)
            
            mask = cv2.erode(mask, kernel_erosion, iterations=1)
            mask = cv2.dilate(mask, kernel_dilation, iterations=2)
            
            # 查找轮廓
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            results = []
            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                
                # 过滤面积
                min_area = self.detection_config['min_area']
                max_area = self.detection_config['max_area']
                
                if min_area <= area <= max_area:
                    # 获取边界框
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # 计算中心点
                    center_x = x + w // 2
                    center_y = y + h // 2
                    
                    # 计算相对位置（相对于图像中心）
                    image_center_x, image_center_y = 320, 240
                    relative_x = (center_x - image_center_x) / image_center_x
                    relative_y = (center_y - image_center_y) / image_center_y
                    
                    # 判断位置
                    if abs(relative_x) < 0.1 and abs(relative_y) < 0.1:
                        position = "center"
                    elif relative_x < -0.1:
                        position = "left"
                    elif relative_x > 0.1:
                        position = "right"
                    else:
                        position = "unknown"
                    
                    result = {
                        'id': i + 1,
                        'center': (center_x, center_y),
                        'position': position,
                        'relative_position': (relative_x, relative_y),
                        'area': area,
                        'bbox': (x, y, w, h),
                        'confidence': min(area / 1000, 1.0)  # 简单的置信度计算
                    }
                    results.append(result)
                    
                    # 在图像上绘制标记
                    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    cv2.circle(image, (center_x, center_y), 5, (0, 0, 255), -1)
                    cv2.putText(image, f"Plant{result['id']}", (x, y - 10), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # 按面积排序（从大到小）
            results.sort(key=lambda x: x['area'], reverse=True)
            
            return results, image
            
        except Exception as e:
            self.logger.error(f"绿色植物检测失败: {e}")
            return [], image
    
    def detect_obstacles(self, image):
        """检测障碍物（基于边缘检测）"""
        try:
            # 转换为灰度图
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 高斯模糊
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # 边缘检测
            edges = cv2.Canny(blurred, 50, 150)
            
            # 查找轮廓
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            obstacles = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 1000:  # 过滤小轮廓
                    x, y, w, h = cv2.boundingRect(contour)
                    center_x = x + w // 2
                    center_y = y + h // 2
                    
                    obstacles.append({
                        'center': (center_x, center_y),
                        'area': area,
                        'bbox': (x, y, w, h),
                        'distance': self.estimate_distance(area)  # 估算距离
                    })
            
            return obstacles
            
        except Exception as e:
            self.logger.error(f"障碍物检测失败: {e}")
            return []
    
    def estimate_distance(self, area):
        """根据轮廓面积估算距离（简化版）"""
        # 这是一个简化的距离估算，实际应用中需要标定
        if area > 5000:
            return "near"
        elif area > 2000:
            return "medium"
        else:
            return "far"
    
    def analyze_scene(self, image):
        """分析整个场景"""
        try:
            # 检测植物
            plants, annotated_image = self.detect_green_plants(image.copy())
            
            # 检测障碍物
            obstacles = self.detect_obstacles(annotated_image.copy())
            
            # 场景分析
            scene_info = {
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'plants': plants,
                'obstacles': obstacles,
                'plant_count': len(plants),
                'obstacle_count': len(obstacles),
                'has_target': len(plants) > 0,
                'target_position': plants[0]['position'] if plants else None,
                'recommended_action': self.get_recommended_action(plants, obstacles)
            }
            
            return scene_info, annotated_image
            
        except Exception as e:
            self.logger.error(f"场景分析失败: {e}")
            return {}, image
    
    def get_recommended_action(self, plants, obstacles):
        """获取推荐动作"""
        if not plants:
            return "search"
        
        # 获取最大的植物目标
        main_target = plants[0]
        
        if main_target['position'] == "center":
            return "approach"
        elif main_target['position'] == "left":
            return "turn_left"
        elif main_target['position'] == "right":
            return "turn_right"
        else:
            return "search"
    
    def save_detection_result(self, scene_info, image):
        """保存检测结果"""
        try:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            
            # 保存图像
            image_filename = f"detection_{timestamp}.jpg"
            image_path = self.save_dir / image_filename
            cv2.imwrite(str(image_path), image)
            
            # 保存检测结果
            result_filename = f"detection_{timestamp}.json"
            result_path = self.save_dir / result_filename
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(scene_info, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"检测结果已保存: {result_path}")
            return result_path
            
        except Exception as e:
            self.logger.error(f"保存检测结果失败: {e}")
            return None
    
    def continuous_detection(self, duration=30, interval=1):
        """连续检测"""
        self.logger.info(f"开始连续检测，持续{duration}秒，间隔{interval}秒")
        
        start_time = time.time()
        detection_count = 0
        
        while time.time() - start_time < duration:
            # 捕获图像
            image = self.capture_image()
            if image is None:
                continue
            
            # 分析场景
            scene_info, annotated_image = self.analyze_scene(image)
            
            # 保存结果
            self.save_detection_result(scene_info, annotated_image)
            
            detection_count += 1
            self.logger.info(f"检测完成 #{detection_count}: "
                          f"植物{scene_info.get('plant_count', 0)}个, "
                          f"障碍物{scene_info.get('obstacle_count', 0)}个, "
                          f"推荐动作: {scene_info.get('recommended_action', 'unknown')}")
            
            time.sleep(interval)
        
        self.logger.info(f"连续检测完成，共检测{detection_count}次")
        return detection_count
    
    def test_detection(self):
        """测试检测功能"""
        self.logger.info("开始检测测试...")
        
        # 捕获测试图像
        image = self.capture_image()
        if image is None:
            self.logger.error("无法捕获图像，测试失败")
            return False
        
        # 检测植物
        plants, annotated_image = self.detect_green_plants(image.copy())
        
        # 检测障碍物
        obstacles = self.detect_obstacles(annotated_image.copy())
        
        # 保存测试结果
        scene_info = {
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'test_mode': True,
            'plants': plants,
            'obstacles': obstacles
        }
        
        self.save_detection_result(scene_info, annotated_image)
        
        # 输出结果
        self.logger.info(f"测试完成 - 检测到{len(plants)}个植物，{len(obstacles)}个障碍物")
        
        for plant in plants:
            self.logger.info(f"  植物{plant['id']}: 位置{plant['position']}, "
                          f"面积{plant['area']}, 置信度{plant['confidence']:.2f}")
        
        return True
    
    def cleanup(self):
        """清理资源"""
        try:
            if PICAMERA_AVAILABLE and hasattr(self, 'camera'):
                self.camera.close()
            elif hasattr(self, 'camera') and self.camera is not None:
                self.camera.release()
            
            self.logger.info("检测器资源已清理")
        except Exception as e:
            self.logger.error(f"清理失败: {e}")
    
    def __del__(self):
        """析构函数"""
        self.cleanup()

# 测试代码
if __name__ == "__main__":
    import sys
    
    config_file = None
    duration = 30
    
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    if len(sys.argv) > 2:
        duration = int(sys.argv[2])
    
    detector = SimpleDetector(config_file)
    
    try:
        command = input("选择测试模式 (test/continuous/manual): ").strip().lower()
        
        if command == "test":
            detector.test_detection()
        elif command == "continuous":
            detector.continuous_detection(duration)
        elif command == "manual":
            while True:
                img = input("按回车捕获图像 (quit退出): ").strip()
                if img == "quit":
                    break
                detector.test_detection()
        else:
            print("无效命令")
    
    except KeyboardInterrupt:
        print("\n程序被用户中断")
    finally:
        detector.cleanup()