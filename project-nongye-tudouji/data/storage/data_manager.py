"""
农业机器人数据管理器
提供数据存储、查询、分析和可视化功能
"""

import sqlite3
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataManager:
    """数据管理器"""
    
    def __init__(self, db_path: str = "agricultural_robot.db"):
        """
        初始化数据管理器
        
        Args:
            db_path: 数据库路径
        """
        self.db_path = db_path
        self.init_database()
        
        # 数据缓存
        self.cache = {}
        self.cache_expiry = {}
        self.cache_duration = 300  # 5分钟缓存
    
    def init_database(self):
        """初始化数据库表"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 机器人状态表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS robot_status (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        robot_id TEXT NOT NULL,
                        status TEXT NOT NULL,
                        position_x REAL,
                        position_y REAL,
                        position_theta REAL,
                        battery_level INTEGER,
                        mode TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (robot_id) REFERENCES robots (id)
                    )
                ''')
                
                # 检测结果详细表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS detection_details (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        robot_id TEXT NOT NULL,
                        class_id INTEGER NOT NULL,
                        class_name TEXT NOT NULL,
                        confidence REAL NOT NULL,
                        bbox_x REAL NOT NULL,
                        bbox_y REAL NOT NULL,
                        bbox_width REAL NOT NULL,
                        bbox_height REAL NOT NULL,
                        center_x REAL NOT NULL,
                        center_y REAL NOT NULL,
                        area REAL NOT NULL,
                        image_path TEXT,
                        weather_condition TEXT,
                        light_level REAL,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (robot_id) REFERENCES robots (id)
                    )
                ''')
                
                # 作业记录表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS operation_records (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        robot_id TEXT NOT NULL,
                        operation_type TEXT NOT NULL,
                        start_time TIMESTAMP,
                        end_time TIMESTAMP,
                        duration INTEGER,
                        area_covered REAL,
                        resource_usage TEXT,  -- JSON格式存储资源使用情况
                        success_rate REAL,
                        notes TEXT,
                        FOREIGN KEY (robot_id) REFERENCES robots (id)
                    )
                ''')
                
                # 作物生长数据表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS crop_growth_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        field_id TEXT NOT NULL,
                        row_number INTEGER,
                        plant_number INTEGER,
                        growth_stage TEXT,
                        height REAL,
                        leaf_count INTEGER,
                        health_status TEXT,
                        disease_symptoms TEXT,
                        estimated_yield REAL,
                        measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        measured_by TEXT
                    )
                ''')
                
                # 环境监测表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS environment_monitoring (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        sensor_id TEXT NOT NULL,
                        location_x REAL,
                        location_y REAL,
                        temperature REAL,
                        humidity REAL,
                        soil_moisture REAL,
                        soil_ph REAL,
                        soil_nutrients TEXT,  -- JSON格式
                        light_intensity REAL,
                        co2_level REAL,
                        wind_speed REAL,
                        rainfall REAL,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # 资源使用表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS resource_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        robot_id TEXT NOT NULL,
                        resource_type TEXT NOT NULL,  -- water, fertilizer, pesticide, electricity
                        usage_amount REAL NOT NULL,
                        unit TEXT NOT NULL,
                        cost REAL,
                        operation_id INTEGER,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (robot_id) REFERENCES robots (id),
                        FOREIGN KEY (operation_id) REFERENCES operation_records (id)
                    )
                ''')
                
                # 预警记录表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS alerts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        alert_type TEXT NOT NULL,  -- error, warning, info
                        severity INTEGER NOT NULL,   -- 1-5, 5最严重
                        source TEXT NOT NULL,       -- robot, sensor, system
                        robot_id TEXT,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        data TEXT,                 -- JSON格式存储相关数据
                        status TEXT DEFAULT 'active', -- active, acknowledged, resolved
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        resolved_at TIMESTAMP,
                        resolved_by TEXT,
                        FOREIGN KEY (robot_id) REFERENCES robots (id)
                    )
                ''')
                
                # 性能指标表
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS performance_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        robot_id TEXT NOT NULL,
                        metric_name TEXT NOT NULL,
                        metric_value REAL NOT NULL,
                        metric_unit TEXT,
                        measurement_period TEXT,   -- daily, weekly, monthly
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (robot_id) REFERENCES robots (id)
                    )
                ''')
                
                # 创建索引以提高查询性能
                indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_robot_status_robot_id ON robot_status(robot_id)",
                    "CREATE INDEX IF NOT EXISTS idx_robot_status_timestamp ON robot_status(timestamp)",
                    "CREATE INDEX IF NOT EXISTS idx_detection_robot_id ON detection_details(robot_id)",
                    "CREATE INDEX IF NOT EXISTS idx_detection_timestamp ON detection_details(timestamp)",
                    "CREATE INDEX IF NOT EXISTS idx_detection_class ON detection_details(class_name)",
                    "CREATE INDEX IF NOT EXISTS idx_operation_robot_id ON operation_records(robot_id)",
                    "CREATE INDEX IF NOT EXISTS idx_operation_time ON operation_records(start_time)",
                    "CREATE INDEX IF NOT EXISTS idx_environment_timestamp ON environment_monitoring(timestamp)",
                    "CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)",
                    "CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)"
                ]
                
                for index_sql in indexes:
                    cursor.execute(index_sql)
                
                conn.commit()
                logger.info("数据库初始化完成")
                
        except Exception as e:
            logger.error(f"数据库初始化失败: {e}")
            raise
    
    def insert_detection_result(self, robot_id: str, detection: Dict) -> int:
        """
        插入检测结果
        
        Args:
            robot_id: 机器人ID
            detection: 检测结果字典
        
        Returns:
            插入记录的ID
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO detection_details 
                    (robot_id, class_id, class_name, confidence, bbox_x, bbox_y, 
                     bbox_width, bbox_height, center_x, center_y, area, image_path,
                     weather_condition, light_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    robot_id,
                    detection.get('class_id', 0),
                    detection.get('class_name', ''),
                    detection.get('confidence', 0.0),
                    detection.get('bbox', [0, 0, 0, 0])[0],
                    detection.get('bbox', [0, 0, 0, 0])[1],
                    detection.get('bbox', [0, 0, 0, 0])[2],
                    detection.get('bbox', [0, 0, 0, 0])[3],
                    detection.get('center_x', 0.0),
                    detection.get('center_y', 0.0),
                    detection.get('area', 0.0),
                    detection.get('image_path', ''),
                    detection.get('weather_condition', ''),
                    detection.get('light_level', 0.0)
                ))
                
                record_id = cursor.lastrowid
                conn.commit()
                
                # 清除相关缓存
                self._clear_cache(f"detections_{robot_id}")
                
                return record_id
                
        except Exception as e:
            logger.error(f"插入检测结果失败: {e}")
            raise
    
    def insert_robot_status(self, robot_id: str, status: Dict) -> int:
        """
        插入机器人状态
        
        Args:
            robot_id: 机器人ID
            status: 状态字典
        
        Returns:
            插入记录的ID
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO robot_status 
                    (robot_id, status, position_x, position_y, position_theta, 
                     battery_level, mode)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    robot_id,
                    status.get('status', ''),
                    status.get('position', {}).get('x', 0.0),
                    status.get('position', {}).get('y', 0.0),
                    status.get('position', {}).get('theta', 0.0),
                    status.get('battery_level', 0),
                    status.get('mode', '')
                ))
                
                record_id = cursor.lastrowid
                conn.commit()
                
                # 清除相关缓存
                self._clear_cache(f"status_{robot_id}")
                
                return record_id
                
        except Exception as e:
            logger.error(f"插入机器人状态失败: {e}")
            raise
    
    def get_detections_by_timerange(self, robot_id: str = None, 
                                  start_time: datetime = None,
                                  end_time: datetime = None,
                                  class_name: str = None) -> List[Dict]:
        """
        根据时间范围获取检测结果
        
        Args:
            robot_id: 机器人ID (可选)
            start_time: 开始时间 (可选)
            end_time: 结束时间 (可选)
            class_name: 类别名称 (可选)
        
        Returns:
            检测结果列表
        """
        cache_key = f"detections_{robot_id}_{start_time}_{end_time}_{class_name}"
        
        # 检查缓存
        cached_result = self._get_cache(cache_key)
        if cached_result:
            return cached_result
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                query = "SELECT * FROM detection_details WHERE 1=1"
                params = []
                
                if robot_id:
                    query += " AND robot_id = ?"
                    params.append(robot_id)
                
                if start_time:
                    query += " AND timestamp >= ?"
                    params.append(start_time)
                
                if end_time:
                    query += " AND timestamp <= ?"
                    params.append(end_time)
                
                if class_name:
                    query += " AND class_name = ?"
                    params.append(class_name)
                
                query += " ORDER BY timestamp DESC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                # 转换为字典列表
                columns = [desc[0] for desc in cursor.description]
                results = []
                
                for row in rows:
                    result = dict(zip(columns, row))
                    # 将bbox转换为列表
                    if result['bbox_x'] is not None:
                        result['bbox'] = [
                            result['bbox_x'], result['bbox_y'],
                            result['bbox_width'], result['bbox_height']
                        ]
                        # 移除单独的bbox字段
                        del result['bbox_x']
                        del result['bbox_y']
                        del result['bbox_width']
                        del result['bbox_height']
                    results.append(result)
                
                # 缓存结果
                self._set_cache(cache_key, results)
                
                return results
                
        except Exception as e:
            logger.error(f"查询检测结果失败: {e}")
            return []
    
    def get_detection_statistics(self, robot_id: str = None,
                              time_period: str = "day") -> Dict:
        """
        获取检测统计信息
        
        Args:
            robot_id: 机器人ID (可选)
            time_period: 时间周期 (hour, day, week, month)
        
        Returns:
            统计信息字典
        """
        cache_key = f"detection_stats_{robot_id}_{time_period}"
        
        # 检查缓存
        cached_result = self._get_cache(cache_key)
        if cached_result:
            return cached_result
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 计算时间范围
                end_time = datetime.now()
                if time_period == "hour":
                    start_time = end_time - timedelta(hours=1)
                elif time_period == "day":
                    start_time = end_time - timedelta(days=1)
                elif time_period == "week":
                    start_time = end_time - timedelta(weeks=1)
                elif time_period == "month":
                    start_time = end_time - timedelta(days=30)
                else:
                    start_time = end_time - timedelta(days=1)
                
                query = '''
                    SELECT class_name, COUNT(*) as count, AVG(confidence) as avg_confidence
                    FROM detection_details
                    WHERE timestamp >= ? AND timestamp <= ?
                '''
                params = [start_time, end_time]
                
                if robot_id:
                    query += " AND robot_id = ?"
                    params.append(robot_id)
                
                query += " GROUP BY class_name"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                # 构建统计结果
                statistics = {
                    'period': time_period,
                    'start_time': start_time.isoformat(),
                    'end_time': end_time.isoformat(),
                    'total_detections': 0,
                    'class_breakdown': {},
                    'confidence_distribution': {}
                }
                
                total_confidence = 0
                detection_count = 0
                
                for row in rows:
                    class_name, count, avg_conf = row
                    statistics['class_breakdown'][class_name] = {
                        'count': count,
                        'avg_confidence': round(avg_conf, 3)
                    }
                    statistics['total_detections'] += count
                    
                    if avg_conf is not None:
                        total_confidence += avg_conf * count
                        detection_count += count
                
                if detection_count > 0:
                    statistics['average_confidence'] = round(total_confidence / detection_count, 3)
                else:
                    statistics['average_confidence'] = 0.0
                
                # 缓存结果
                self._set_cache(cache_key, statistics)
                
                return statistics
                
        except Exception as e:
            logger.error(f"获取检测统计失败: {e}")
            return {}
    
    def get_robot_performance_metrics(self, robot_id: str, 
                                   metric_name: str = None,
                                   time_period: str = "day") -> List[Dict]:
        """
        获取机器人性能指标
        
        Args:
            robot_id: 机器人ID
            metric_name: 指标名称 (可选)
            time_period: 时间周期
        
        Returns:
            性能指标列表
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 计算时间范围
                end_time = datetime.now()
                if time_period == "hour":
                    start_time = end_time - timedelta(hours=1)
                elif time_period == "day":
                    start_time = end_time - timedelta(days=1)
                elif time_period == "week":
                    start_time = end_time - timedelta(weeks=1)
                elif time_period == "month":
                    start_time = end_time - timedelta(days=30)
                else:
                    start_time = end_time - timedelta(days=1)
                
                query = '''
                    SELECT metric_name, metric_value, metric_unit, timestamp
                    FROM performance_metrics
                    WHERE robot_id = ? AND timestamp >= ? AND timestamp <= ?
                '''
                params = [robot_id, start_time, end_time]
                
                if metric_name:
                    query += " AND metric_name = ?"
                    params.append(metric_name)
                
                query += " ORDER BY timestamp ASC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                columns = [desc[0] for desc in cursor.description]
                results = [dict(zip(columns, row)) for row in rows]
                
                return results
                
        except Exception as e:
            logger.error(f"获取性能指标失败: {e}")
            return []
    
    def analyze_crop_yield_trends(self, field_id: str = None,
                               time_period: str = "month") -> Dict:
        """
        分析作物产量趋势
        
        Args:
            field_id: 田地ID (可选)
            time_period: 时间周期
        
        Returns:
            产量趋势分析结果
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # 计算时间范围
                end_time = datetime.now()
                if time_period == "week":
                    start_time = end_time - timedelta(weeks=12)  # 12周
                elif time_period == "month":
                    start_time = end_time - timedelta(days=180)  # 6个月
                elif time_period == "year":
                    start_time = end_time - timedelta(days=365)  # 1年
                else:
                    start_time = end_time - timedelta(days=180)
                
                query = '''
                    SELECT 
                        DATE(measurement_date) as date,
                        AVG(height) as avg_height,
                        AVG(leaf_count) as avg_leaf_count,
                        AVG(estimated_yield) as avg_yield,
                        COUNT(*) as measurement_count,
                        health_status
                    FROM crop_growth_data
                    WHERE measurement_date >= ? AND measurement_date <= ?
                '''
                params = [start_time, end_time]
                
                if field_id:
                    query += " AND field_id = ?"
                    params.append(field_id)
                
                query += '''
                    GROUP BY DATE(measurement_date), health_status
                    ORDER BY date ASC
                '''
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                if not rows:
                    return {'error': '未找到作物生长数据'}
                
                # 处理数据
                df_data = []
                for row in rows:
                    df_data.append({
                        'date': row[0],
                        'avg_height': row[1],
                        'avg_leaf_count': row[2],
                        'avg_yield': row[3],
                        'measurement_count': row[4],
                        'health_status': row[5]
                    })
                
                if df_data:
                    df = pd.DataFrame(df_data)
                    
                    # 按日期聚合
                    daily_data = df.groupby('date').agg({
                        'avg_height': 'mean',
                        'avg_leaf_count': 'mean',
                        'avg_yield': 'mean',
                        'measurement_count': 'sum'
                    }).reset_index()
                    
                    # 计算趋势
                    if len(daily_data) > 1:
                        height_trend = np.polyfit(range(len(daily_data)), daily_data['avg_height'], 1)[0]
                        yield_trend = np.polyfit(range(len(daily_data)), daily_data['avg_yield'], 1)[0]
                    else:
                        height_trend = 0
                        yield_trend = 0
                    
                    result = {
                        'period': time_period,
                        'data_points': len(daily_data),
                        'height_trend': 'increasing' if height_trend > 0 else 'decreasing',
                        'yield_trend': 'increasing' if yield_trend > 0 else 'decreasing',
                        'daily_data': daily_data.to_dict('records'),
                        'current_avg_height': daily_data['avg_height'].iloc[-1] if len(daily_data) > 0 else 0,
                        'current_avg_yield': daily_data['avg_yield'].iloc[-1] if len(daily_data) > 0 else 0
                    }
                    
                    return result
                
                return {'error': '数据处理失败'}
                
        except Exception as e:
            logger.error(f"分析作物产量趋势失败: {e}")
            return {'error': str(e)}
    
    def get_resource_usage_report(self, robot_id: str = None,
                                resource_type: str = None,
                                start_date: datetime = None,
                                end_date: datetime = None) -> Dict:
        """
        获取资源使用报告
        
        Args:
            robot_id: 机器人ID (可选)
            resource_type: 资源类型 (可选)
            start_date: 开始日期 (可选)
            end_date: 结束日期 (可选)
        
        Returns:
            资源使用报告
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                query = '''
                    SELECT 
                        resource_type,
                        SUM(usage_amount) as total_usage,
                        AVG(usage_amount) as avg_usage,
                        MIN(usage_amount) as min_usage,
                        MAX(usage_amount) as max_usage,
                        COUNT(*) as usage_count,
                        unit
                    FROM resource_usage
                    WHERE 1=1
                '''
                params = []
                
                if robot_id:
                    query += " AND robot_id = ?"
                    params.append(robot_id)
                
                if resource_type:
                    query += " AND resource_type = ?"
                    params.append(resource_type)
                
                if start_date:
                    query += " AND timestamp >= ?"
                    params.append(start_date)
                
                if end_date:
                    query += " AND timestamp <= ?"
                    params.append(end_date)
                
                query += " GROUP BY resource_type, unit"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                report = {
                    'summary': {
                        'total_resources': len(rows),
                        'report_period': {
                            'start': start_date.isoformat() if start_date else None,
                            'end': end_date.isoformat() if end_date else None
                        }
                    },
                    'resource_breakdown': {}
                }
                
                for row in rows:
                    resource_type, total, avg, min_val, max_val, count, unit = row
                    report['resource_breakdown'][resource_type] = {
                        'total_usage': round(total, 2),
                        'average_usage': round(avg, 2),
                        'min_usage': round(min_val, 2),
                        'max_usage': round(max_val, 2),
                        'usage_count': count,
                        'unit': unit
                    }
                
                return report
                
        except Exception as e:
            logger.error(f"获取资源使用报告失败: {e}")
            return {'error': str(e)}
    
    def export_data_to_csv(self, table_name: str, output_path: str,
                          filters: Dict = None) -> bool:
        """
        导出数据到CSV文件
        
        Args:
            table_name: 表名
            output_path: 输出文件路径
            filters: 过滤条件 (可选)
        
        Returns:
            导出是否成功
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                # 构建查询
                query = f"SELECT * FROM {table_name}"
                params = []
                
                if filters:
                    conditions = []
                    for column, value in filters.items():
                        conditions.append(f"{column} = ?")
                        params.append(value)
                    query += " WHERE " + " AND ".join(conditions)
                
                # 读取数据到DataFrame
                df = pd.read_sql_query(query, conn, params=params)
                
                # 导出到CSV
                df.to_csv(output_path, index=False)
                logger.info(f"数据已导出到: {output_path}")
                
                return True
                
        except Exception as e:
            logger.error(f"导出数据失败: {e}")
            return False
    
    def _get_cache(self, key: str) -> Any:
        """获取缓存"""
        if key in self.cache:
            if key in self.cache_expiry:
                if datetime.now() < self.cache_expiry[key]:
                    return self.cache[key]
                else:
                    del self.cache[key]
                    del self.cache_expiry[key]
        return None
    
    def _set_cache(self, key: str, value: Any):
        """设置缓存"""
        self.cache[key] = value
        self.cache_expiry[key] = datetime.now() + timedelta(seconds=self.cache_duration)
    
    def _clear_cache(self, key_pattern: str = None):
        """清除缓存"""
        if key_pattern:
            # 清除匹配模式的缓存
            keys_to_remove = [key for key in self.cache.keys() if key_pattern in key]
            for key in keys_to_remove:
                if key in self.cache:
                    del self.cache[key]
                if key in self.cache_expiry:
                    del self.cache_expiry[key]
        else:
            # 清除所有缓存
            self.cache.clear()
            self.cache_expiry.clear()

# 数据分析器
class DataAnalyzer:
    """数据分析器"""
    
    def __init__(self, data_manager: DataManager):
        """
        初始化数据分析器
        
        Args:
            data_manager: 数据管理器实例
        """
        self.data_manager = data_manager
    
    def generate_detection_heatmap(self, robot_id: str = None,
                                  time_period: str = "day") -> np.ndarray:
        """
        生成检测热力图
        
        Args:
            robot_id: 机器人ID (可选)
            time_period: 时间周期
        
        Returns:
            热力图数组
        """
        # 获取检测结果
        detections = self.data_manager.get_detections_by_timerange(
            robot_id=robot_id,
            time_period=time_period
        )
        
        if not detections:
            return np.zeros((100, 100))  # 默认大小
        
        # 转换为坐标数组
        x_coords = [d['center_x'] for d in detections]
        y_coords = [d['center_y'] for d in detections]
        
        # 创建2D直方图
        heatmap, xedges, yedges = np.histogram2d(
            x_coords, y_coords, bins=50
        )
        
        return heatmap.T
    
    def analyze_detection_patterns(self, robot_id: str = None) -> Dict:
        """
        分析检测模式
        
        Args:
            robot_id: 机器人ID (可选)
        
        Returns:
            检测模式分析结果
        """
        # 获取最近的检测数据
        end_time = datetime.now()
        start_time = end_time - timedelta(days=7)  # 最近7天
        
        detections = self.data_manager.get_detections_by_timerange(
            robot_id=robot_id,
            start_time=start_time,
            end_time=end_time
        )
        
        if not detections:
            return {'error': '没有检测数据'}
        
        # 分析类别分布
        class_counts = {}
        for detection in detections:
            class_name = detection['class_name']
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        # 分析时间分布
        hour_counts = {}
        for detection in detections:
            hour = detection['timestamp'].hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        # 分析置信度分布
        confidences = [d['confidence'] for d in detections]
        
        analysis = {
            'total_detections': len(detections),
            'class_distribution': class_counts,
            'time_distribution': hour_counts,
            'confidence_stats': {
                'mean': np.mean(confidences),
                'std': np.std(confidences),
                'min': np.min(confidences),
                'max': np.max(confidences)
            },
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            }
        }
        
        return analysis
    
    def plot_detection_trends(self, robot_id: str = None,
                            save_path: str = None):
        """
        绘制检测趋势图
        
        Args:
            robot_id: 机器人ID (可选)
            save_path: 保存路径 (可选)
        """
        # 获取最近7天的每日统计
        daily_stats = []
        for i in range(7):
            date = datetime.now() - timedelta(days=i)
            stats = self.data_manager.get_detection_statistics(
                robot_id=robot_id,
                time_period="day"
            )
            if stats:
                stats['date'] = date.date().isoformat()
                daily_stats.append(stats)
        
        if not daily_stats:
            print("没有可用的统计数据")
            return
        
        # 转换为DataFrame
        df = pd.DataFrame(daily_stats)
        
        # 绘制趋势图
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # 1. 每日检测总数
        axes[0, 0].plot(df['date'], df['total_detections'], marker='o')
        axes[0, 0].set_title('每日检测总数')
        axes[0, 0].set_xlabel('日期')
        axes[0, 0].set_ylabel('检测数量')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # 2. 平均置信度
        avg_confidences = [s.get('average_confidence', 0) for s in df['class_breakdown']]
        axes[0, 1].plot(df['date'], avg_confidences, marker='s', color='orange')
        axes[0, 1].set_title('平均置信度')
        axes[0, 1].set_xlabel('日期')
        axes[0, 1].set_ylabel('置信度')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # 3. 类别分布
        class_names = set()
        for stats in df['class_breakdown']:
            class_names.update(stats.get('class_breakdown', {}).keys())
        
        for class_name in list(class_names)[:5]:  # 最多显示5个类别
            counts = []
            for stats in df['class_breakdown']:
                class_breakdown = stats.get('class_breakdown', {})
                counts.append(class_breakdown.get(class_name, 0))
            
            axes[1, 0].plot(df['date'], counts, marker='^', label=class_name)
        
        axes[1, 0].set_title('各类别检测数量')
        axes[1, 0].set_xlabel('日期')
        axes[1, 0].set_ylabel('检测数量')
        axes[1, 0].legend()
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 4. 检测热力图
        heatmap = self.generate_detection_heatmap(robot_id)
        im = axes[1, 1].imshow(heatmap, cmap='hot', interpolation='nearest')
        axes[1, 1].set_title('检测热力图')
        plt.colorbar(im, ax=axes[1, 1])
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"图表已保存到: {save_path}")
        else:
            plt.show()
        
        plt.close()

# 使用示例
if __name__ == "__main__":
    # 创建数据管理器
    data_manager = DataManager()
    
    # 创建数据分析器
    analyzer = DataAnalyzer(data_manager)
    
    # 模拟插入一些测试数据
    test_detection = {
        'class_id': 0,
        'class_name': '土豆',
        'confidence': 0.92,
        'bbox': [100, 100, 50, 50],
        'center_x': 125,
        'center_y': 125,
        'area': 2500,
        'weather_condition': 'sunny',
        'light_level': 80000
    }
    
    # 插入检测数据
    record_id = data_manager.insert_detection_result("robot_01", test_detection)
    print(f"插入检测结果，ID: {record_id}")
    
    # 获取检测统计
    stats = data_manager.get_detection_statistics(time_period="day")
    print("检测统计:", stats)
    
    # 资源使用报告
    resource_report = data_manager.get_resource_usage_report()
    print("资源使用报告:", resource_report)
    
    # 分析检测模式
    patterns = analyzer.analyze_detection_patterns("robot_01")
    print("检测模式分析:", patterns)