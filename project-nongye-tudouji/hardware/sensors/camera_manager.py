"""
摄像头管理模块
支持多种摄像头接口和图像处理功能
"""

import cv2
import numpy as np
import threading
import time
from typing import Optional, Tuple, Dict, List
from enum import Enum
import json

class CameraType(Enum):
    """摄像头类型枚举"""
    USB_CAMERA = "usb"           # USB摄像头
    RTSP_STREAM = "rtsp"         # RTSP网络流
    CSI_CAMERA = "csi"           # CSI摄像头（如树莓派）
    IP_CAMERA = "ip"             # IP摄像头

class ImageFormat(Enum):
    """图像格式枚举"""
    RGB = "rgb"
    BGR = "bgr"
    GRAY = "gray"
    YUV = "yuv"

class CameraManager:
    """摄像头管理器"""
    
    def __init__(self, config: dict):
        """
        初始化摄像头管理器
        
        Args:
            config: 配置参数字典
        """
        self.config = config
        self.camera_type = CameraType(config.get('type', 'usb'))
        self.resolution = tuple(config.get('resolution', [1920, 1080]))
        self.fps = config.get('fps', 30)
        self.auto_exposure = config.get('auto_exposure', True)
        self.brightness = config.get('brightness', 0)
        self.contrast = config.get('contrast', 32)
        self.saturation = config.get('saturation', 32)
        
        # 摄像头连接参数
        self.source = config.get('source', 0)  # USB摄像头设备号或RTSP URL
        self.username = config.get('username', '')
        self.password = config.get('password', '')
        
        # 状态变量
        self.is_connected = False
        self.is_recording = False
        self.is_streaming = False
        
        # 视频捕获对象
        self.cap: Optional[cv2.VideoCapture] = None
        
        # 当前帧数据
        self.current_frame = None
        self.current_timestamp = 0
        self.frame_count = 0
        
        # 录制相关
        self.video_writer: Optional[cv2.VideoWriter] = None
        self.record_filename = ""
        
        # 线程锁
        self.lock = threading.Lock()
        
        # 捕获线程
        self.capture_thread = None
        self.running = False
        
        # 性能统计
        self.fps_actual = 0
        self.last_fps_time = time.time()
        self.frames_since_last_fps = 0
        
    def connect(self) -> bool:
        """
        连接摄像头
        
        Returns:
            bool: 连接是否成功
        """
        try:
            if self.camera_type == CameraType.USB_CAMERA:
                self.cap = cv2.VideoCapture(self.source)
                if not self.cap.isOpened():
                    print(f"无法打开USB摄像头: {self.source}")
                    return False
                    
            elif self.camera_type == CameraType.RTSP_STREAM:
                # 构建RTSP URL
                if self.username and self.password:
                    rtsp_url = f"rtsp://{self.username}:{self.password}@{self.source}"
                else:
                    rtsp_url = f"rtsp://{self.source}"
                
                self.cap = cv2.VideoCapture(rtsp_url)
                if not self.cap.isOpened():
                    print(f"无法连接RTSP流: {rtsp_url}")
                    return False
                    
            elif self.camera_type == CameraType.CSI_CAMERA:
                # CSI摄像头（树莓派等）
                gstreamer_pipeline = self._build_gstreamer_pipeline()
                self.cap = cv2.VideoCapture(gstreamer_pipeline, cv2.CAP_GSTREAMER)
                if not self.cap.isOpened():
                    print("无法打开CSI摄像头")
                    return False
                    
            elif self.camera_type == CameraType.IP_CAMERA:
                # IP摄像头
                ip_url = f"http://"
                if self.username and self.password:
                    ip_url += f"{self.username}:{self.password}@"
                ip_url += self.source
                
                self.cap = cv2.VideoCapture(ip_url)
                if not self.cap.isOpened():
                    print(f"无法连接IP摄像头: {ip_url}")
                    return False
            
            # 设置摄像头参数
            self._setup_camera_properties()
            
            # 测试获取一帧
            ret, frame = self.cap.read()
            if not ret:
                print("无法获取摄像头画面")
                self.cap.release()
                return False
            
            self.is_connected = True
            print(f"摄像头连接成功: {self.camera_type.value}")
            return True
            
        except Exception as e:
            print(f"摄像头连接失败: {e}")
            return False
    
    def _build_gstreamer_pipeline(self) -> str:
        """构建GStreamer管道（CSI摄像头）"""
        pipeline = (
            f"nvarguscamerasrc ! "
            f"video/x-raw(memory:NVMM), "
            f"width={self.resolution[0]}, height={self.resolution[1]}, "
            f"framerate={self.fps}/1, "
            f"format=NV12 ! "
            f"nvvidconv ! "
            f"video/x-raw, format=BGRx ! "
            f"videoconvert ! "
            f"video/x-raw, format=BGR ! "
            f"appsink"
        )
        return pipeline
    
    def _setup_camera_properties(self):
        """设置摄像头属性"""
        if not self.cap:
            return
        
        # 设置分辨率
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        
        # 设置帧率
        self.cap.set(cv2.CAP_PROP_FPS, self.fps)
        
        # 设置图像质量
        self.cap.set(cv2.CAP_PROP_BRIGHTNESS, self.brightness / 100.0)
        self.cap.set(cv2.CAP_PROP_CONTRAST, self.contrast / 100.0)
        self.cap.set(cv2.CAP_PROP_SATURATION, self.saturation / 100.0)
        
        # 自动曝光
        self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 1 if self.auto_exposure else 0)
        
        # 缓冲区设置（减少延迟）
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    def start_streaming(self) -> bool:
        """
        开始视频流采集
        
        Returns:
            bool: 启动是否成功
        """
        if not self.is_connected:
            if not self.connect():
                return False
        
        if self.is_streaming:
            return True
        
        self.running = True
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()
        
        self.is_streaming = True
        print("视频流采集已启动")
        return True
    
    def stop_streaming(self):
        """停止视频流采集"""
        self.running = False
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)
        
        self.is_streaming = False
        print("视频流采集已停止")
    
    def _capture_loop(self):
        """采集循环"""
        last_time = time.time()
        
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                print("无法获取摄像头画面")
                time.sleep(0.1)
                continue
            
            with self.lock:
                self.current_frame = frame.copy()
                self.current_timestamp = time.time()
                self.frame_count += 1
            
            # 计算实际FPS
            self.frames_since_last_fps += 1
            current_time = time.time()
            if current_time - self.last_fps_time >= 1.0:
                self.fps_actual = self.frames_since_last_fps / (current_time - self.last_fps_time)
                self.frames_since_last_fps = 0
                self.last_fps_time = current_time
            
            # 帧率控制
            elapsed = time.time() - last_time
            target_time = 1.0 / self.fps
            if elapsed < target_time:
                time.sleep(target_time - elapsed)
            last_time = time.time()
    
    def get_frame(self) -> Optional[np.ndarray]:
        """
        获取当前帧
        
        Returns:
            np.ndarray: 当前帧图像，如果失败返回None
        """
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None
    
    def get_frame_info(self) -> Dict:
        """
        获取帧信息
        
        Returns:
            Dict: 包含帧信息的字典
        """
        with self.lock:
            return {
                'timestamp': self.current_timestamp,
                'frame_count': self.frame_count,
                'fps_actual': self.fps_actual,
                'resolution': self.resolution,
                'fps_target': self.fps
            }
    
    def start_recording(self, filename: str, codec: str = "XVID") -> bool:
        """
        开始录制视频
        
        Args:
            filename: 视频文件名
            codec: 视频编码器
        
        Returns:
            bool: 录制是否成功启动
        """
        if self.is_recording:
            return True
        
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            self.video_writer = cv2.VideoWriter(
                filename, fourcc, self.fps, self.resolution
            )
            
            if not self.video_writer.isOpened():
                print("无法创建视频写入器")
                return False
            
            self.record_filename = filename
            self.is_recording = True
            print(f"开始录制视频: {filename}")
            return True
            
        except Exception as e:
            print(f"启动录制失败: {e}")
            return False
    
    def stop_recording(self) -> str:
        """
        停止录制
        
        Returns:
            str: 录制的文件名
        """
        if not self.is_recording:
            return ""
        
        if self.video_writer:
            self.video_writer.release()
            self.video_writer = None
        
        self.is_recording = False
        filename = self.record_filename
        self.record_filename = ""
        print(f"录制完成: {filename}")
        return filename
    
    def save_snapshot(self, filename: str) -> bool:
        """
        保存当前帧为图片
        
        Args:
            filename: 图片文件名
        
        Returns:
            bool: 保存是否成功
        """
        frame = self.get_frame()
        if frame is not None:
            try:
                cv2.imwrite(filename, frame)
                print(f"截图保存: {filename}")
                return True
            except Exception as e:
                print(f"保存截图失败: {e}")
                return False
        return False
    
    def apply_image_processing(self, frame: np.ndarray, processing_config: dict) -> np.ndarray:
        """
        应用图像处理
        
        Args:
            frame: 输入图像
            processing_config: 处理配置
        
        Returns:
            np.ndarray: 处理后的图像
        """
        processed = frame.copy()
        
        # 高斯模糊
        if processing_config.get('gaussian_blur', False):
            kernel_size = processing_config.get('blur_kernel_size', 5)
            processed = cv2.GaussianBlur(processed, (kernel_size, kernel_size), 0)
        
        # 边缘检测
        if processing_config.get('edge_detection', False):
            threshold1 = processing_config.get('edge_threshold1', 50)
            threshold2 = processing_config.get('edge_threshold2', 150)
            processed = cv2.Canny(processed, threshold1, threshold2)
        
        # 直方图均衡化
        if processing_config.get('histogram_equalization', False):
            if len(processed.shape) == 3:
                # 彩色图像：转换到YUV空间，对Y通道均衡化
                yuv = cv2.cvtColor(processed, cv2.COLOR_BGR2YUV)
                yuv[:,:,0] = cv2.equalizeHist(yuv[:,:,0])
                processed = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)
            else:
                # 灰度图像
                processed = cv2.equalizeHist(processed)
        
        # 色彩空间转换
        color_space = processing_config.get('color_space', 'BGR')
        if color_space == 'RGB':
            processed = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
        elif color_space == 'GRAY':
            processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
        
        return processed
    
    def get_camera_info(self) -> Dict:
        """获取摄像头信息"""
        info = {
            'type': self.camera_type.value,
            'source': self.source,
            'resolution': self.resolution,
            'fps': self.fps,
            'is_connected': self.is_connected,
            'is_streaming': self.is_streaming,
            'is_recording': self.is_recording,
            'fps_actual': self.fps_actual,
            'frame_count': self.frame_count
        }
        
        # 添加摄像头硬件信息
        if self.cap and self.is_connected:
            try:
                info.update({
                    'backend_name': self.cap.getBackendName(),
                    'actual_resolution': [
                        int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                        int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    ],
                    'actual_fps': self.cap.get(cv2.CAP_PROP_FPS),
                    'brightness': self.cap.get(cv2.CAP_PROP_BRIGHTNESS),
                    'contrast': self.cap.get(cv2.CAP_PROP_CONTRAST),
                    'saturation': self.cap.get(cv2.CAP_PROP_SATURATION)
                })
            except:
                pass
        
        return info
    
    def disconnect(self):
        """断开摄像头连接"""
        self.stop_streaming()
        
        if self.is_recording:
            self.stop_recording()
        
        if self.cap:
            self.cap.release()
            self.cap = None
        
        self.is_connected = False
        print("摄像头已断开连接")
    
    def __del__(self):
        """析构函数"""
        self.disconnect()

# 使用示例
if __name__ == "__main__":
    # USB摄像头配置
    usb_config = {
        'type': 'usb',
        'source': 0,  # 默认USB摄像头
        'resolution': [1920, 1080],
        'fps': 30,
        'auto_exposure': True,
        'brightness': 0,
        'contrast': 32,
        'saturation': 32
    }
    
    # 创建摄像头管理器
    camera = CameraManager(usb_config)
    
    try:
        # 连接摄像头
        if camera.connect():
            # 开始视频流
            camera.start_streaming()
            
            # 获取一帧并保存
            frame = camera.get_frame()
            if frame is not None:
                cv2.imwrite('test_frame.jpg', frame)
                print("测试帧已保存")
            
            # 开始录制
            camera.start_recording('test_video.avi')
            time.sleep(5.0)  # 录制5秒
            camera.stop_recording()
            
            # 打印摄像头信息
            print("摄像头信息:")
            print(json.dumps(camera.get_camera_info(), indent=2, ensure_ascii=False))
            
    except KeyboardInterrupt:
        print("用户中断")
    
    finally:
        camera.disconnect()