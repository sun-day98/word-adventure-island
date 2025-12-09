"""
农业目标检测数据集准备脚本
支持数据增强、标注格式转换、数据集划分等功能
"""

import os
import json
import cv2
import numpy as np
from pathlib import Path
import random
import shutil
from typing import List, Dict, Tuple, Optional
import xml.etree.ElementTree as ET
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatasetPreparation:
    """数据集准备工具类"""
    
    def __init__(self, config: dict):
        """
        初始化数据集准备工具
        
        Args:
            config: 配置参数字典
        """
        self.config = config
        
        # 路径配置
        self.source_dir = Path(config.get('source_dir', 'data/raw'))
        self.output_dir = Path(config.get('output_dir', 'data/processed'))
        self.dataset_name = config.get('dataset_name', 'agricultural_detection')
        
        # 类别配置
        self.class_names = config.get('class_names', [
            'potato', 'sweet_potato', 'weed', 'disease', 'insect',
            'healthy_leaf', 'yellow_leaf', 'dry_soil', 'wet_soil'
        ])
        
        # 数据集划分比例
        self.train_ratio = config.get('train_ratio', 0.7)
        self.val_ratio = config.get('val_ratio', 0.2)
        self.test_ratio = config.get('test_ratio', 0.1)
        
        # 图像处理参数
        self.image_size = tuple(config.get('image_size', [640, 640]))
        self.enable_augmentation = config.get('enable_augmentation', True)
        self.augmentation_factor = config.get('augmentation_factor', 3)
        
        # 输出格式
        self.output_format = config.get('output_format', 'yolo')  # yolo, coco, pascal_voc
        
        # 创建输出目录
        self._create_output_directories()
    
    def _create_output_directories(self):
        """创建输出目录结构"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 创建YOLO格式目录
        if self.output_format == 'yolo':
            for split in ['train', 'val', 'test']:
                (self.output_dir / 'images' / split).mkdir(parents=True, exist_ok=True)
                (self.output_dir / 'labels' / split).mkdir(parents=True, exist_ok=True)
        
        # 创建COCO格式目录
        elif self.output_format == 'coco':
            (self.output_dir / 'coco').mkdir(parents=True, exist_ok=True)
        
        # 创建Pascal VOC格式目录
        elif self.output_format == 'pascal_voc':
            for split in ['train', 'val', 'test']:
                (self.output_dir / 'pascal_voc' / split).mkdir(parents=True, exist_ok=True)
    
    def convert_coco_to_yolo(self, coco_json_path: str, image_dir: str):
        """
        将COCO格式转换为YOLO格式
        
        Args:
            coco_json_path: COCO标注文件路径
            image_dir: 图像文件目录
        """
        try:
            with open(coco_json_path, 'r') as f:
                coco_data = json.load(f)
            
            # 创建类别映射
            categories = {cat['id']: cat['name'] for cat in coco_data['categories']}
            
            # 转换标注
            for annotation in coco_data['annotations']:
                image_id = annotation['image_id']
                image_info = next(img for img in coco_data['images'] if img['id'] == image_id)
                
                # 获取图像文件名
                image_filename = image_info['file_name']
                image_path = os.path.join(image_dir, image_filename)
                
                if not os.path.exists(image_path):
                    continue
                
                # 读取图像尺寸
                img = cv2.imread(image_path)
                if img is None:
                    continue
                
                height, width = img.shape[:2]
                
                # 创建YOLO标注文件
                label_filename = os.path.splitext(image_filename)[0] + '.txt'
                label_path = self.output_dir / 'labels' / label_filename
                
                # 转换边界框格式
                bbox = annotation['bbox']  # [x, y, w, h]
                category_id = annotation['category_id']
                
                # 归一化坐标
                x_center = (bbox[0] + bbox[2] / 2) / width
                y_center = (bbox[1] + bbox[3] / 2) / height
                normalized_width = bbox[2] / width
                normalized_height = bbox[3] / height
                
                # 写入YOLO格式
                with open(label_path, 'a') as f:
                    f.write(f"{category_id-1} {x_center} {y_center} {normalized_width} {normalized_height}\n")
                
                # 复制图像文件
                output_image_path = self.output_dir / 'images' / image_filename
                shutil.copy2(image_path, output_image_path)
            
            logger.info(f"COCO转YOLO完成，处理了 {len(coco_data['annotations'])} 个标注")
            
        except Exception as e:
            logger.error(f"COCO转YOLO失败: {e}")
    
    def convert_pascal_voc_to_yolo(self, voc_dir: str):
        """
        将Pascal VOC格式转换为YOLO格式
        
        Args:
            voc_dir: VOC数据集目录
        """
        try:
            voc_dir = Path(voc_dir)
            
            # 创建类别ID映射
            class_to_id = {name: idx for idx, name in enumerate(self.class_names)}
            
            # 处理所有XML文件
            xml_files = list(voc_dir.glob('**/*.xml'))
            
            for xml_file in xml_files:
                try:
                    # 解析XML
                    tree = ET.parse(xml_file)
                    root = tree.getroot()
                    
                    # 获取图像信息
                    filename = root.find('filename').text
                    size = root.find('size')
                    width = int(size.find('width').text)
                    height = int(size.find('height').text)
                    
                    # 查找对应的图像文件
                    image_path = xml_file.parent / 'JPEGImages' / filename
                    if not image_path.exists():
                        image_path = xml_file.parent / filename
                    
                    if not image_path.exists():
                        logger.warning(f"找不到图像文件: {image_path}")
                        continue
                    
                    # 创建YOLO标注文件
                    label_filename = xml_file.stem + '.txt'
                    label_path = self.output_dir / 'labels' / label_filename
                    
                    # 转换所有对象
                    for obj in root.findall('object'):
                        class_name = obj.find('name').text
                        if class_name not in class_to_id:
                            continue
                        
                        class_id = class_to_id[class_name]
                        
                        # 获取边界框
                        bbox = obj.find('bndbox')
                        xmin = float(bbox.find('xmin').text)
                        ymin = float(bbox.find('ymin').text)
                        xmax = float(bbox.find('xmax').text)
                        ymax = float(bbox.find('ymax').text)
                        
                        # 转换为YOLO格式
                        x_center = (xmin + xmax) / 2 / width
                        y_center = (ymin + ymax) / 2 / height
                        obj_width = (xmax - xmin) / width
                        obj_height = (ymax - ymin) / height
                        
                        # 写入标注文件
                        with open(label_path, 'a') as f:
                            f.write(f"{class_id} {x_center} {y_center} {obj_width} {obj_height}\n")
                    
                    # 复制图像文件
                    output_image_path = self.output_dir / 'images' / filename
                    shutil.copy2(image_path, output_image_path)
                
                except Exception as e:
                    logger.error(f"处理XML文件失败 {xml_file}: {e}")
                    continue
            
            logger.info(f"Pascal VOC转YOLO完成，处理了 {len(xml_files)} 个XML文件")
            
        except Exception as e:
            logger.error(f"Pascal VOC转YOLO失败: {e}")
    
    def augment_dataset(self, input_dir: Path, output_dir: Path, num_augmentations: int = 3):
        """
        数据增强
        
        Args:
            input_dir: 输入图像目录
            output_dir: 输出目录
            num_augmentations: 每张图像增强次数
        """
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # 获取所有图像文件
            image_files = list(input_dir.glob('*.jpg')) + list(input_dir.glob('*.png'))
            
            for image_file in image_files:
                try:
                    # 读取图像
                    image = cv2.imread(str(image_file))
                    if image is None:
                        continue
                    
                    # 获取对应的标注文件
                    label_file = image_file.with_suffix('.txt')
                    if not label_file.exists():
                        continue
                    
                    # 读取标注
                    annotations = self._read_yolo_annotations(label_file)
                    
                    # 复制原始文件
                    shutil.copy2(image_file, output_dir / image_file.name)
                    shutil.copy2(label_file, output_dir / label_file.name)
                    
                    # 生成增强图像
                    for i in range(num_augmentations):
                        augmented_image, augmented_annotations = self._apply_augmentation(
                            image, annotations, i
                        )
                        
                        # 保存增强图像和标注
                        aug_name = f"{image_file.stem}_aug_{i}{image_file.suffix}"
                        aug_label_name = f"{image_file.stem}_aug_{i}.txt"
                        
                        cv2.imwrite(str(output_dir / aug_name), augmented_image)
                        self._write_yolo_annotations(
                            output_dir / aug_label_name, augmented_annotations
                        )
                
                except Exception as e:
                    logger.error(f"处理图像失败 {image_file}: {e}")
                    continue
            
            logger.info(f"数据增强完成，生成了 {len(image_files) * num_augmentations} 张增强图像")
            
        except Exception as e:
            logger.error(f"数据增强失败: {e}")
    
    def _read_yolo_annotations(self, label_file: Path) -> List[List[float]]:
        """读取YOLO格式标注"""
        annotations = []
        try:
            with open(label_file, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        annotations.append([float(x) for x in parts])
        except Exception as e:
            logger.error(f"读取标注文件失败 {label_file}: {e}")
        
        return annotations
    
    def _write_yolo_annotations(self, label_file: Path, annotations: List[List[float]]):
        """写入YOLO格式标注"""
        try:
            with open(label_file, 'w') as f:
                for annotation in annotations:
                    line = ' '.join([str(x) for x in annotation])
                    f.write(line + '\n')
        except Exception as e:
            logger.error(f"写入标注文件失败 {label_file}: {e}")
    
    def _apply_augmentation(self, image: np.ndarray, annotations: List[List[float]], 
                          aug_type: int) -> Tuple[np.ndarray, List[List[float]]]:
        """
        应用数据增强
        
        Args:
            image: 输入图像
            annotations: YOLO格式标注
            aug_type: 增强类型
        
        Returns:
            Tuple[np.ndarray, List[List[float]]]: 增强后的图像和标注
        """
        height, width = image.shape[:2]
        aug_image = image.copy()
        aug_annotations = [ann.copy() for ann in annotations]
        
        # 根据类型应用不同增强
        if aug_type % 4 == 0:
            # 水平翻转
            aug_image = cv2.flip(aug_image, 1)
            for ann in aug_annotations:
                ann[1] = 1.0 - ann[1]  # 翻转x坐标
        
        elif aug_type % 4 == 1:
            # 旋转90度
            aug_image = cv2.rotate(aug_image, cv2.ROTATE_90_CLOCKWISE)
            new_height, new_width = aug_image.shape[:2]
            for ann in aug_annotations:
                # 交换并调整坐标
                x_center, y_center, w, h = ann[1], ann[2], ann[3], ann[4]
                ann[1] = y_center  # 新的x中心
                ann[2] = x_center  # 新的y中心
                ann[3] = h * height / new_width  # 新的宽度
                ann[4] = w * width / new_height   # 新的高度
        
        elif aug_type % 4 == 2:
            # 亮度调整
            brightness_factor = random.uniform(0.8, 1.2)
            aug_image = cv2.convertScaleAbs(aug_image, alpha=brightness_factor, beta=0)
        
        elif aug_type % 4 == 3:
            # 随机裁剪和缩放
            scale = random.uniform(0.8, 1.0)
            new_height, new_width = int(height * scale), int(width * scale)
            
            # 随机裁剪
            start_y = random.randint(0, height - new_height)
            start_x = random.randint(0, width - new_width)
            
            aug_image = aug_image[start_y:start_y+new_height, start_x:start_x+new_width]
            aug_image = cv2.resize(aug_image, (width, height))
            
            # 调整标注坐标
            for ann in aug_annotations:
                ann[1] = (ann[1] * width - start_x) / new_width
                ann[2] = (ann[2] * height - start_y) / new_height
                ann[3] = ann[3] * width / new_width
                ann[4] = ann[4] * height / new_height
        
        return aug_image, aug_annotations
    
    def split_dataset(self, images_dir: Path, labels_dir: Path):
        """
        划分数据集
        
        Args:
            images_dir: 图像目录
            labels_dir: 标注目录
        """
        try:
            # 获取所有图像文件
            image_files = list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.png'))
            
            # 随机打乱
            random.shuffle(image_files)
            
            # 计算划分数量
            total_count = len(image_files)
            train_count = int(total_count * self.train_ratio)
            val_count = int(total_count * self.val_ratio)
            
            # 划分文件
            train_files = image_files[:train_count]
            val_files = image_files[train_count:train_count + val_count]
            test_files = image_files[train_count + val_count:]
            
            # 移动文件到对应目录
            self._move_files_to_split(train_files, labels_dir, 'train')
            self._move_files_to_split(val_files, labels_dir, 'val')
            self._move_files_to_split(test_files, labels_dir, 'test')
            
            logger.info(f"数据集划分完成: 训练集{len(train_files)}, 验证集{len(val_files)}, 测试集{len(test_files)}")
            
        except Exception as e:
            logger.error(f"数据集划分失败: {e}")
    
    def _move_files_to_split(self, files: List[Path], labels_dir: Path, split_name: str):
        """移动文件到指定划分目录"""
        for image_file in files:
            try:
                # 移动图像
                dest_image = self.output_dir / 'images' / split_name / image_file.name
                shutil.move(str(image_file), str(dest_image))
                
                # 移动标注文件
                label_file = labels_dir / image_file.with_suffix('.txt').name
                if label_file.exists():
                    dest_label = self.output_dir / 'labels' / split_name / label_file.name
                    shutil.move(str(label_file), str(dest_label))
            except Exception as e:
                logger.error(f"移动文件失败 {image_file}: {e}")
    
    def create_yaml_config(self):
        """创建YOLO配置文件"""
        config_data = {
            'path': str(self.output_dir),
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'nc': len(self.class_names),
            'names': self.class_names
        }
        
        yaml_path = self.output_dir / f'{self.dataset_name}.yaml'
        try:
            import yaml
            with open(yaml_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_data, f, default_flow_style=False, allow_unicode=True)
            logger.info(f"配置文件已创建: {yaml_path}")
        except ImportError:
            # 如果没有yaml库，使用JSON格式
            json_path = self.output_dir / f'{self.dataset_name}.json'
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=2, ensure_ascii=False)
            logger.info(f"配置文件已创建: {json_path}")
    
    def create_dataset_statistics(self):
        """创建数据集统计信息"""
        stats = {
            'dataset_name': self.dataset_name,
            'creation_time': datetime.now().isoformat(),
            'classes': self.class_names,
            'splits': {},
            'total_images': 0,
            'total_annotations': 0,
            'class_distribution': {}
        }
        
        # 统计每个划分
        for split_name in ['train', 'val', 'test']:
            split_dir = self.output_dir / 'labels' / split_name
            if not split_dir.exists():
                continue
            
            label_files = list(split_dir.glob('*.txt'))
            split_stats = {
                'image_count': len(label_files),
                'class_counts': {name: 0 for name in self.class_names}
            }
            
            # 统计每个类别的数量
            for label_file in label_files:
                try:
                    with open(label_file, 'r') as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                class_id = int(parts[0])
                                if class_id < len(self.class_names):
                                    class_name = self.class_names[class_id]
                                    split_stats['class_counts'][class_name] += 1
                                    stats['total_annotations'] += 1
                except Exception as e:
                    logger.error(f"统计标注文件失败 {label_file}: {e}")
            
            stats['splits'][split_name] = split_stats
            stats['total_images'] += len(label_files)
        
        # 汇总类别分布
        for class_name in self.class_names:
            stats['class_distribution'][class_name] = sum(
                split_stats['class_counts'].get(class_name, 0)
                for split_stats in stats['splits'].values()
            )
        
        # 保存统计信息
        stats_path = self.output_dir / 'dataset_statistics.json'
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        
        logger.info(f"数据集统计信息已保存: {stats_path}")
        return stats

# 使用示例
if __name__ == "__main__":
    # 配置参数
    config = {
        'source_dir': 'data/raw',
        'output_dir': 'data/processed',
        'dataset_name': 'agricultural_detection',
        'class_names': [
            'potato', 'sweet_potato', 'weed', 'disease', 'insect',
            'healthy_leaf', 'yellow_leaf', 'dry_soil', 'wet_soil'
        ],
        'train_ratio': 0.7,
        'val_ratio': 0.2,
        'test_ratio': 0.1,
        'image_size': [640, 640],
        'enable_augmentation': True,
        'augmentation_factor': 3,
        'output_format': 'yolo'
    }
    
    # 创建数据集准备工具
    dataset_prep = DatasetPreparation(config)
    
    try:
        # 示例1: 转换COCO格式到YOLO
        # dataset_prep.convert_coco_to_yolo(
        #     'data/raw/coco_annotations.json',
        #     'data/raw/images'
        # )
        
        # 示例2: 转换Pascal VOC格式到YOLO
        # dataset_prep.convert_pascal_voc_to_yolo('data/raw/voc_dataset')
        
        # 示例3: 数据增强
        if dataset_prep.enable_augmentation:
            input_aug_dir = Path('data/temp/aug_input')
            output_aug_dir = Path('data/temp/aug_output')
            
            if input_aug_dir.exists():
                dataset_prep.augment_dataset(input_aug_dir, output_aug_dir)
        
        # 示例4: 数据集划分
        images_dir = Path('data/temp/images')
        labels_dir = Path('data/temp/labels')
        
        if images_dir.exists() and labels_dir.exists():
            dataset_prep.split_dataset(images_dir, labels_dir)
        
        # 创建配置文件
        dataset_prep.create_yaml_config()
        
        # 生成统计信息
        stats = dataset_prep.create_dataset_statistics()
        print("\n数据集统计信息:")
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        
    except Exception as e:
        logger.error(f"数据集准备失败: {e}")
        raise