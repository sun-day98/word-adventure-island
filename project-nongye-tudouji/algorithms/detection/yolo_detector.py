"""
YOLOv11目标检测模块
专为农业场景优化的作物检测系统
"""

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from typing import List, Dict, Tuple, Optional
import json
import time
import os
from pathlib import Path
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DetectionResult:
    """检测结果数据类"""
    
    def __init__(self, class_id: int, class_name: str, confidence: float, 
                 bbox: List[float], timestamp: float = None):
        """
        初始化检测结果
        
        Args:
            class_id: 类别ID
            class_name: 类别名称
            confidence: 置信度 (0-1)
            bbox: 边界框 [x, y, w, h]
            timestamp: 时间戳
        """
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox  # [x, y, w, h]
        self.timestamp = timestamp or time.time()
        
        # 计算中心点
        self.center_x = bbox[0] + bbox[2] / 2
        self.center_y = bbox[1] + bbox[3] / 2
        
        # 计算面积
        self.area = bbox[2] * bbox[3]
    
    def to_dict(self) -> Dict:
        """转换为字典格式"""
        return {
            'class_id': self.class_id,
            'class_name': self.class_name,
            'confidence': self.confidence,
            'bbox': self.bbox,
            'center_x': self.center_x,
            'center_y': self.center_y,
            'area': self.area,
            'timestamp': self.timestamp
        }

class YOLODetector:
    """YOLOv11检测器"""
    
    def __init__(self, config: dict):
        """
        初始化YOLO检测器
        
        Args:
            config: 配置参数字典
        """
        self.config = config
        self.model_path = config.get('model_path', 'data/models/yolov11.pt')
        self.confidence_threshold = config.get('confidence_threshold', 0.5)
        self.nms_threshold = config.get('nms_threshold', 0.4)
        self.input_size = tuple(config.get('input_size', [640, 640]))
        self.device = config.get('device', 'auto')  # auto, cpu, cuda
        
        # 类别配置
        self.class_names = config.get('class_names', [
            'potato', 'sweet_potato', 'weed', 'disease', 'insect',
            'healthy_leaf', 'yellow_leaf', 'dry_soil', 'wet_soil'
        ])
        self.target_classes = config.get('target_classes', self.class_names)
        
        # 图像预处理
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # 模型和设备
        self.model = None
        self.device = self._setup_device()
        
        # 性能统计
        self.inference_time = 0
        self.frame_count = 0
        self.fps = 0
        self.last_fps_time = time.time()
        
        # 加载模型
        self.load_model()
        
        # 检测历史（用于跟踪和过滤）
        self.detection_history = []
        self.max_history_size = 100
        
    def _setup_device(self) -> torch.device:
        """设置计算设备"""
        if self.device == 'auto':
            if torch.cuda.is_available():
                device = torch.device('cuda')
                logger.info(f"使用GPU: {torch.cuda.get_device_name()}")
            else:
                device = torch.device('cpu')
                logger.info("使用CPU")
        else:
            device = torch.device(self.device)
        
        return device
    
    def load_model(self) -> bool:
        """
        加载YOLOv11模型
        
        Returns:
            bool: 加载是否成功
        """
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"模型文件不存在: {self.model_path}")
                return False
            
            # 加载模型（这里需要根据实际的YOLOv11实现调整）
            if self.model_path.endswith('.pt'):
                # PyTorch格式
                self.model = torch.load(self.model_path, map_location=self.device)
            elif self.model_path.endswith('.onnx'):
                # ONNX格式
                import onnxruntime as ort
                self.model = ort.InferenceSession(self.model_path)
            else:
                logger.error("不支持的模型格式")
                return False
            
            # 设置为评估模式
            if hasattr(self.model, 'eval'):
                self.model.eval()
            
            # 移动到指定设备
            if hasattr(self.model, 'to'):
                self.model = self.model.to(self.device)
            
            logger.info(f"模型加载成功: {self.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            return False
    
    def preprocess_image(self, image: np.ndarray) -> Tuple[np.ndarray, float, float]:
        """
        图像预处理
        
        Args:
            image: 输入图像 (BGR)
        
        Returns:
            Tuple[np.ndarray, float, float]: (预处理后的图像, 缩放比例, 填充大小)
        """
        # 获取原始尺寸
        original_height, original_width = image.shape[:2]
        
        # 计算缩放比例
        scale = min(self.input_size[0] / original_width, 
                   self.input_size[1] / original_height)
        
        # 计算新尺寸
        new_width = int(original_width * scale)
        new_height = int(original_height * scale)
        
        # 调整图像大小
        resized_image = cv2.resize(image, (new_width, new_height))
        
        # 计算填充
        pad_width = (self.input_size[0] - new_width) // 2
        pad_height = (self.input_size[1] - new_height) // 2
        
        # 创建填充后的图像
        padded_image = cv2.copyMakeBorder(
            resized_image, 
            pad_height, self.input_size[1] - new_height - pad_height,
            pad_width, self.input_size[0] - new_width - pad_width,
            cv2.BORDER_CONSTANT, value=(114, 114, 114)
        )
        
        # 转换为RGB
        padded_image = cv2.cvtColor(padded_image, cv2.COLOR_BGR2RGB)
        
        return padded_image, scale, (pad_width, pad_height)
    
    def postprocess_outputs(self, outputs: torch.Tensor, scale: float, 
                          padding: Tuple[float, float]) -> List[DetectionResult]:
        """
        后处理模型输出
        
        Args:
            outputs: 模型原始输出
            scale: 图像缩放比例
            padding: 填充大小
        
        Returns:
            List[DetectionResult]: 检测结果列表
        """
        detections = []
        
        try:
            # 这里需要根据实际的YOLOv11输出格式调整
            if len(outputs.shape) == 3:
                outputs = outputs.squeeze(0)  # 移除batch维度
            
            # 过滤低置信度检测
            mask = outputs[:, 4] > self.confidence_threshold
            filtered_outputs = outputs[mask]
            
            if len(filtered_outputs) == 0:
                return detections
            
            # 非极大值抑制
            boxes = filtered_outputs[:, :4]
            scores = filtered_outputs[:, 4]
            class_ids = filtered_outputs[:, 5:].argmax(dim=1)
            
            # 转换坐标格式
            boxes[:, 0] = (boxes[:, 0] - padding[0]) / scale  # x
            boxes[:, 1] = (boxes[:, 1] - padding[1]) / scale  # y
            boxes[:, 2] = boxes[:, 2] / scale                 # w
            boxes[:, 3] = boxes[:, 3] / scale                 # h
            
            # NMS
            keep_indices = cv2.dnn.NMSBoxes(
                boxes.tolist(), scores.tolist(), 
                self.confidence_threshold, self.nms_threshold
            )
            
            if len(keep_indices) > 0:
                keep_indices = keep_indices.flatten()
                
                for idx in keep_indices:
                    box = boxes[idx].tolist()
                    score = scores[idx].item()
                    class_id = class_ids[idx].item()
                    
                    # 转换为[x, y, w, h]格式
                    bbox = [box[0], box[1], box[2], box[3]]
                    
                    # 创建检测结果
                    if class_id < len(self.class_names):
                        class_name = self.class_names[class_id]
                        
                        # 只保留目标类别
                        if class_name in self.target_classes:
                            detection = DetectionResult(
                                class_id=class_id,
                                class_name=class_name,
                                confidence=score,
                                bbox=bbox
                            )
                            detections.append(detection)
        
        except Exception as e:
            logger.error(f"后处理失败: {e}")
        
        return detections
    
    def detect(self, image: np.ndarray) -> List[DetectionResult]:
        """
        执行目标检测
        
        Args:
            image: 输入图像 (BGR)
        
        Returns:
            List[DetectionResult]: 检测结果列表
        """
        if self.model is None:
            logger.error("模型未加载")
            return []
        
        start_time = time.time()
        
        try:
            # 图像预处理
            processed_image, scale, padding = self.preprocess_image(image)
            
            # 转换为tensor
            input_tensor = torch.from_numpy(processed_image).permute(2, 0, 1).float()
            input_tensor = input_tensor.unsqueeze(0).to(self.device)
            
            # 推理
            with torch.no_grad():
                outputs = self.model(input_tensor)
            
            # 后处理
            detections = self.postprocess_outputs(outputs, scale, padding)
            
            # 更新历史记录
            self.detection_history.extend(detections)
            if len(self.detection_history) > self.max_history_size:
                self.detection_history = self.detection_history[-self.max_history_size:]
            
            # 更新性能统计
            inference_time = time.time() - start_time
            self.inference_time = inference_time
            self.frame_count += 1
            
            # 计算FPS
            current_time = time.time()
            if current_time - self.last_fps_time >= 1.0:
                self.fps = self.frame_count / (current_time - self.last_fps_time)
                self.frame_count = 0
                self.last_fps_time = current_time
            
            logger.debug(f"检测完成，耗时: {inference_time*1000:.1f}ms，检测到 {len(detections)} 个目标")
            
            return detections
            
        except Exception as e:
            logger.error(f"检测失败: {e}")
            return []
    
    def filter_detections_by_area(self, detections: List[DetectionResult], 
                                 min_area: float = 100, 
                                 max_area: float = None) -> List[DetectionResult]:
        """
        根据面积过滤检测结果
        
        Args:
            detections: 检测结果列表
            min_area: 最小面积
            max_area: 最大面积
        
        Returns:
            List[DetectionResult]: 过滤后的检测结果
        """
        filtered = []
        for detection in detections:
            if detection.area >= min_area:
                if max_area is None or detection.area <= max_area:
                    filtered.append(detection)
        return filtered
    
    def filter_detections_by_confidence(self, detections: List[DetectionResult], 
                                      min_confidence: float = 0.7) -> List[DetectionResult]:
        """
        根据置信度过滤检测结果
        
        Args:
            detections: 检测结果列表
            min_confidence: 最小置信度
        
        Returns:
            List[DetectionResult]: 过滤后的检测结果
        """
        return [d for d in detections if d.confidence >= min_confidence]
    
    def group_detections_by_class(self, detections: List[DetectionResult]) -> Dict[str, List[DetectionResult]]:
        """
        按类别分组检测结果
        
        Args:
            detections: 检测结果列表
        
        Returns:
            Dict[str, List[DetectionResult]]: 按类别分组的检测结果
        """
        grouped = {}
        for detection in detections:
            class_name = detection.class_name
            if class_name not in grouped:
                grouped[class_name] = []
            grouped[class_name].append(detection)
        return grouped
    
    def count_detections(self, detections: List[DetectionResult]) -> Dict[str, int]:
        """
        统计各类别检测数量
        
        Args:
            detections: 检测结果列表
        
        Returns:
            Dict[str, int]: 各类别数量统计
        """
        counts = {}
        grouped = self.group_detections_by_class(detections)
        for class_name, class_detections in grouped.items():
            counts[class_name] = len(class_detections)
        return counts
    
    def draw_detections(self, image: np.ndarray, detections: List[DetectionResult], 
                       show_confidence: bool = True, show_class_name: bool = True) -> np.ndarray:
        """
        在图像上绘制检测结果
        
        Args:
            image: 输入图像 (BGR)
            detections: 检测结果列表
            show_confidence: 是否显示置信度
            show_class_name: 是否显示类别名称
        
        Returns:
            np.ndarray: 绘制后的图像
        """
        output_image = image.copy()
        
        # 颜色映射
        colors = {
            'potato': (0, 255, 0),           # 绿色
            'sweet_potato': (255, 0, 0),      # 蓝色
            'weed': (0, 0, 255),             # 红色
            'disease': (255, 255, 0),        # 青色
            'insect': (255, 0, 255),         # 洋红色
            'healthy_leaf': (0, 255, 255),   # 黄色
            'yellow_leaf': (128, 128, 128),  # 灰色
            'dry_soil': (165, 42, 42),       # 棕色
            'wet_soil': (0, 128, 128)        # 深青色
        }
        
        for detection in detections:
            # 获取颜色
            color = colors.get(detection.class_name, (128, 128, 128))
            
            # 绘制边界框
            x, y, w, h = map(int, detection.bbox)
            cv2.rectangle(output_image, (x, y), (x + w, y + h), color, 2)
            
            # 准备标签文本
            label_parts = []
            if show_class_name:
                label_parts.append(detection.class_name)
            if show_confidence:
                label_parts.append(f"{detection.confidence:.2f}")
            
            if label_parts:
                label = " ".join(label_parts)
                
                # 计算文本尺寸
                (text_width, text_height), baseline = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1
                )
                
                # 绘制文本背景
                cv2.rectangle(
                    output_image,
                    (x, y - text_height - baseline - 5),
                    (x + text_width, y),
                    color,
                    -1
                )
                
                # 绘制文本
                cv2.putText(
                    output_image, label,
                    (x, y - baseline),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    1
                )
            
            # 绘制中心点
            center_x, center_y = int(detection.center_x), int(detection.center_y)
            cv2.circle(output_image, (center_x, center_y), 3, color, -1)
        
        return output_image
    
    def get_performance_stats(self) -> Dict:
        """获取性能统计信息"""
        return {
            'inference_time_ms': self.inference_time * 1000,
            'fps': self.fps,
            'device': str(self.device),
            'model_path': self.model_path,
            'input_size': self.input_size,
            'confidence_threshold': self.confidence_threshold,
            'nms_threshold': self.nms_threshold,
            'class_count': len(self.class_names)
        }
    
    def save_detections_to_json(self, detections: List[DetectionResult], 
                               filename: str, image_info: Dict = None):
        """
        保存检测结果到JSON文件
        
        Args:
            detections: 检测结果列表
            filename: 文件名
            image_info: 图像信息
        """
        data = {
            'timestamp': time.time(),
            'image_info': image_info or {},
            'detections': [d.to_dict() for d in detections],
            'detection_count': len(detections),
            'class_counts': self.count_detections(detections)
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"检测结果已保存到: {filename}")
        except Exception as e:
            logger.error(f"保存检测结果失败: {e}")

# 使用示例
if __name__ == "__main__":
    # 配置参数
    config = {
        'model_path': 'data/models/yolov11.pt',  # 需要替换为实际模型路径
        'confidence_threshold': 0.5,
        'nms_threshold': 0.4,
        'input_size': [640, 640],
        'device': 'auto',
        'class_names': [
            'potato', 'sweet_potato', 'weed', 'disease', 'insect',
            'healthy_leaf', 'yellow_leaf', 'dry_soil', 'wet_soil'
        ],
        'target_classes': ['potato', 'sweet_potato', 'weed', 'disease']
    }
    
    # 创建检测器
    detector = YOLODetector(config)
    
    try:
        # 如果有摄像头，可以测试实时检测
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # 执行检测
            detections = detector.detect(frame)
            
            # 绘制检测结果
            output_frame = detector.draw_detections(frame, detections)
            
            # 显示性能信息
            stats = detector.get_performance_stats()
            cv2.putText(output_frame, f"FPS: {stats['fps']:.1f}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.putText(output_frame, f"检测到: {len(detections)} 个目标", (10, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # 显示图像
            cv2.imshow('YOLOv11 农业检测', output_frame)
            
            # 按q退出
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"测试失败: {e}")
        
        # 如果没有摄像头，可以测试单张图片
        # image = cv2.imread('test_image.jpg')
        # if image is not None:
        #     detections = detector.detect(image)
        #     print(f"检测到 {len(detections)} 个目标")
        #     for detection in detections:
        #         print(f"- {detection.class_name}: {detection.confidence:.2f}")
    
    finally:
        # 保存性能统计
        stats = detector.get_performance_stats()
        print("\n性能统计:")
        for key, value in stats.items():
            print(f"{key}: {value}")