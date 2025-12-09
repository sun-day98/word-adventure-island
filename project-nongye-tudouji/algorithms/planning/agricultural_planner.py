"""
农业场景专用路径规划器
考虑农田行距、作物行、边界约束等农业特性
"""

import numpy as np
import math
from typing import List, Tuple, Dict, Optional
from .path_planner import GridMap, PathPlanner, PlanningAlgorithm, Node
import cv2

class AgriculturalField:
    """农田场景类"""
    
    def __init__(self, field_width: float, field_height: float, 
                 row_spacing: float = 0.8, plant_spacing: float = 0.3):
        """
        初始化农田场景
        
        Args:
            field_width: 农田宽度 (米)
            field_height: 农田长度 (米)
            row_spacing: 行距 (米)
            plant_spacing: 株距 (米)
        """
        self.field_width = field_width
        self.field_height = field_height
        self.row_spacing = row_spacing
        self.plant_spacing = plant_spacing
        
        # 计算行数和每行作物数
        self.row_count = int(field_height / row_spacing)
        self.plants_per_row = int(field_width / plant_spacing)
        
        # 作物行位置
        self.row_positions = []
        for i in range(self.row_count):
            y = i * row_spacing + row_spacing / 2
            self.row_positions.append(y)
        
        # 障碍物区域 (如灌溉设备、电线杆等)
        self.obstacles = []
        
    def add_obstacle(self, x: float, y: float, width: float, height: float):
        """添加障碍物"""
        self.obstacles.append({
            'x': x, 'y': y,
            'width': width, 'height': height
        })
    
    def is_in_obstacle(self, x: float, y: float) -> bool:
        """检查点是否在障碍物内"""
        for obstacle in self.obstacles:
            if (obstacle['x'] <= x <= obstacle['x'] + obstacle['width'] and
                obstacle['y'] <= y <= obstacle['y'] + obstacle['height']):
                return True
        return False
    
    def get_nearest_row(self, y: float) -> int:
        """获取最近的行索引"""
        min_dist = float('inf')
        nearest_row = 0
        
        for i, row_y in enumerate(self.row_positions):
            dist = abs(y - row_y)
            if dist < min_dist:
                min_dist = dist
                nearest_row = i
        
        return nearest_row
    
    def generate_coverage_path(self, start_x: float = 0.1) -> List[Tuple[float, float]]:
        """生成全覆盖路径 (蛇形路径)"""
        path = []
        current_x = start_x
        current_y = 0.1
        
        for row_idx in range(self.row_count):
            row_y = self.row_positions[row_idx]
            
            if row_idx % 2 == 0:
                # 从左到右
                path.append((current_x, row_y))
                path.append((self.field_width - 0.1, row_y))
                current_x = self.field_width - 0.1
            else:
                # 从右到左
                path.append((current_x, row_y))
                path.append((0.1, row_y))
                current_x = 0.1
            
            # 行间转移路径
            if row_idx < self.row_count - 1:
                next_row_y = self.row_positions[row_idx + 1]
                path.append((current_x, next_row_y))
        
        return path

class CoveragePathPlanner:
    """全覆盖路径规划器"""
    
    def __init__(self, field: AgriculturalField, 
                 robot_width: float = 0.5, turn_radius: float = 1.0):
        """
        初始化全覆盖规划器
        
        Args:
            field: 农田场景
            robot_width: 机器人宽度
            turn_radius: 最小转弯半径
        """
        self.field = field
        self.robot_width = robot_width
        self.turn_radius = turn_radius
        self.coverage_overlap = 0.1  # 覆盖重叠率
        
        # 计算有效行距 (考虑机器人宽度和重叠)
        self.effective_spacing = field.row_spacing - robot_width + self.coverage_overlap
    
    def plan_boustrophedon(self, start_pos: Tuple[float, float]) -> List[Tuple[float, float]]:
        """牛耕式路径规划"""
        path = []
        current_x, current_y = start_pos
        direction = 1  # 1: 向右, -1: 向左
        
        # 确保起始位置在边界内
        current_x = max(self.robot_width / 2, current_x)
        current_x = min(self.field.field_width - self.robot_width / 2, current_x)
        
        row_idx = self.field.get_nearest_row(current_y)
        
        while row_idx < self.field.row_count:
            row_y = self.field.row_positions[row_idx]
            
            # 检查该行是否有障碍物
            if self._row_has_obstacle(row_y):
                # 跳过有障碍物的行或绕行
                path.extend(self._plan_obstacle_avoidance(current_x, row_y, direction))
            else:
                # 正常行路径
                if direction == 1:
                    # 向右
                    path.append((current_x, row_y))
                    path.append((self.field.field_width - self.robot_width / 2, row_y))
                    current_x = self.field.field_width - self.robot_width / 2
                else:
                    # 向左
                    path.append((current_x, row_y))
                    path.append((self.robot_width / 2, row_y))
                    current_x = self.robot_width / 2
            
            # 转向下一行
            if row_idx < self.field.row_count - 1:
                next_row_y = self.field.row_positions[row_idx + 1]
                
                # 计算转弯路径
                turn_path = self._plan_turn(
                    current_x, row_y, current_x, next_row_y, direction
                )
                path.extend(turn_path)
                
                direction *= -1  # 反向
            
            row_idx += 1
        
        return path
    
    def _row_has_obstacle(self, row_y: float) -> bool:
        """检查该行是否有障碍物"""
        for obstacle in self.field.obstacles:
            if (obstacle['y'] <= row_y <= obstacle['y'] + obstacle['height']):
                return True
        return False
    
    def _plan_obstacle_avoidance(self, x: float, y: float, 
                                direction: int) -> List[Tuple[float, float]]:
        """规划障碍物绕行路径"""
        # 简化实现：跳过障碍物行
        return [(x, y)]
    
    def _plan_turn(self, x1: float, y1: float, x2: float, y2: float, 
                 direction: int) -> List[Tuple[float, float]]:
        """规划转弯路径"""
        turn_points = []
        
        # 使用Dubins曲线或简单的三段式转弯
        if direction == 1:
            # 向右转弯，然后向下
            # 第一段：向右
            turn_points.append((x1 + self.turn_radius, y1))
            # 第二段：圆弧转弯
            turn_points.append((x1 + self.turn_radius, y1 + self.turn_radius))
            # 第三段：向下
            turn_points.append((x2, y1 + self.turn_radius))
            turn_points.append((x2, y2))
        else:
            # 向左转弯，然后向下
            # 第一段：向左
            turn_points.append((x1 - self.turn_radius, y1))
            # 第二段：圆弧转弯
            turn_points.append((x1 - self.turn_radius, y1 + self.turn_radius))
            # 第三段：向下
            turn_points.append((x2, y1 + self.turn_radius))
            turn_points.append((x2, y2))
        
        return turn_points

class SpotTreatmentPlanner:
    """定点作业规划器"""
    
    def __init__(self, field: AgriculturalField, grid_map: GridMap):
        """
        初始化定点作业规划器
        
        Args:
            field: 农田场景
            grid_map: 网格地图
        """
        self.field = field
        self.grid_map = grid_map
        self.path_planner = PathPlanner(grid_map)
    
    def plan_inspection_route(self, spots: List[Tuple[float, float]], 
                           start_pos: Tuple[float, float],
                           algorithm: PlanningAlgorithm = PlanningAlgorithm.ASTAR) -> List[Tuple[float, float]]:
        """
        规划检查点巡检路线
        
        Args:
            spots: 检查点列表
            start_pos: 起始位置
            algorithm: 路径规划算法
        
        Returns:
            完整巡检路径
        """
        if not spots:
            return []
        
        # 转换为网格坐标
        grid_spots = [self.grid_map.world_to_grid(x, y) for x, y in spots]
        grid_start = self.grid_map.world_to_grid(start_pos[0], start_pos[1])
        
        # 使用贪心算法确定访问顺序
        unvisited = grid_spots.copy()
        current = grid_start
        full_path = [start_pos]
        
        while unvisited:
            # 找到最近的未访问点
            nearest_dist = float('inf')
            nearest_spot = None
            
            for spot in unvisited:
                dist = math.sqrt((spot[0] - current[0]) ** 2 + (spot[1] - current[1]) ** 2)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_spot = spot
            
            if nearest_spot:
                # 规划到最近点的路径
                self.grid_map.set_start(current[0], current[1])
                self.grid_map.set_goal(nearest_spot[0], nearest_spot[1])
                
                path_segment = self.path_planner.plan(algorithm)
                
                if path_segment:
                    # 转换为世界坐标并添加到完整路径
                    world_segment = [self.grid_map.grid_to_world(x, y) for x, y in path_segment[1:]]
                    full_path.extend(world_segment)
                
                unvisited.remove(nearest_spot)
                current = nearest_spot
        
        return full_path
    
    def plan_treatment_zones(self, detection_results: List[Dict],
                          robot_capacity: int = 10) -> List[List[Tuple[float, float]]]:
        """
        根据检测结果规划作业区域
        
        Args:
            detection_results: 检测结果列表
            robot_capacity: 机器人单次作业容量
        
        Returns:
            作业区域列表
        """
        # 按类别分组检测结果
        class_groups = {}
        for detection in detection_results:
            class_name = detection.get('class_name', 'unknown')
            if class_name not in class_groups:
                class_groups[class_name] = []
            class_groups[class_name].append(detection)
        
        treatment_zones = []
        
        for class_name, detections in class_groups.items():
            # 使用聚类算法确定作业区域
            zones = self._cluster_detections(detections)
            
            for zone in zones:
                # 计算区域边界
                min_x = min(d['bbox'][0] for d in zone)
                max_x = max(d['bbox'][0] + d['bbox'][2] for d in zone)
                min_y = min(d['bbox'][1] for d in zone)
                max_y = max(d['bbox'][1] + d['bbox'][3] for d in zone)
                
                # 转换为世界坐标
                world_min = self.grid_map.grid_to_world(min_x, min_y)
                world_max = self.grid_map.grid_to_world(max_x, max_y)
                
                treatment_zones.append({
                    'class': class_name,
                    'bounds': (world_min, world_max),
                    'detection_count': len(zone)
                })
        
        return treatment_zones
    
    def _cluster_detections(self, detections: List[Dict], 
                         max_distance: float = 5.0) -> List[List[Dict]]:
        """
        聚类检测结果
        
        Args:
            detections: 检测结果列表
            max_distance: 最大聚类距离
        
        Returns:
            聚类结果
        """
        if not detections:
            return []
        
        clusters = []
        unvisited = detections.copy()
        
        while unvisited:
            # 创建新聚类
            cluster = [unvisited[0]]
            unvisited.pop(0)
            
            # 查找邻近检测
            i = 0
            while i < len(unvisited):
                detection = unvisited[i]
                
                # 检查与聚类中任何点的距离
                is_nearby = False
                for cluster_detection in cluster:
                    dist = math.sqrt(
                        (detection['bbox'][0] - cluster_detection['bbox'][0]) ** 2 +
                        (detection['bbox'][1] - cluster_detection['bbox'][1]) ** 2
                    )
                    if dist <= max_distance:
                        is_nearby = True
                        break
                
                if is_nearby:
                    cluster.append(detection)
                    unvisited.pop(i)
                else:
                    i += 1
            
            clusters.append(cluster)
        
        return clusters

class AdaptivePathPlanner:
    """自适应路径规划器"""
    
    def __init__(self, field: AgriculturalField, grid_map: GridMap):
        """
        初始化自适应规划器
        
        Args:
            field: 农田场景
            grid_map: 网格地图
        """
        self.field = field
        self.grid_map = grid_map
        self.path_planner = PathPlanner(grid_map)
        self.coverage_planner = CoveragePathPlanner(field)
        self.spot_planner = SpotTreatmentPlanner(field, grid_map)
        
        # 自适应参数
        self.detection_density_threshold = 0.1  # 检测密度阈值
        self.path_update_frequency = 10  # 路径更新频率
    
    def plan_adaptive_mission(self, mission_type: str, 
                           mission_params: Dict) -> List[Tuple[float, float]]:
        """
        自适应任务规划
        
        Args:
            mission_type: 任务类型
            mission_params: 任务参数
        
        Returns:
            自适应路径
        """
        if mission_type == "full_coverage":
            return self._plan_adaptive_coverage(mission_params)
        elif mission_type == "spot_treatment":
            return self._plan_adaptive_spot_treatment(mission_params)
        elif mission_type == "hybrid":
            return self._plan_hybrid_mission(mission_params)
        else:
            raise ValueError(f"未知任务类型: {mission_type}")
    
    def _plan_adaptive_coverage(self, params: Dict) -> List[Tuple[float, float]]:
        """自适应全覆盖规划"""
        start_pos = params.get('start_pos', (0.1, 0.1))
        
        # 基础覆盖路径
        base_path = self.coverage_planner.plan_boustrophedon(start_pos)
        
        # 根据历史检测数据调整路径
        if 'detection_history' in params:
            detection_history = params['detection_history']
            adjusted_path = self._adjust_path_for_detections(base_path, detection_history)
            return adjusted_path
        
        return base_path
    
    def _plan_adaptive_spot_treatment(self, params: Dict) -> List[Tuple[float, float]]:
        """自适应定点作业规划"""
        detection_results = params.get('detection_results', [])
        start_pos = params.get('start_pos', (0.1, 0.1))
        
        if not detection_results:
            return []
        
        # 转换检测点坐标
        spots = []
        for detection in detection_results:
            bbox = detection['bbox']
            center_x = bbox[0] + bbox[2] / 2
            center_y = bbox[1] + bbox[3] / 2
            spots.append((center_x, center_y))
        
        # 规划巡检路线
        return self.spot_planner.plan_inspection_route(spots, start_pos)
    
    def _plan_hybrid_mission(self, params: Dict) -> List[Tuple[float, float]]:
        """混合任务规划"""
        # 结合覆盖和定点作业
        coverage_priority = params.get('coverage_priority', 0.7)
        
        # 执行全覆盖规划
        coverage_path = self._plan_adaptive_coverage(params)
        
        # 执行定点作业规划
        spot_path = self._plan_adaptive_spot_treatment(params)
        
        # 根据优先级合并路径
        if coverage_priority > 0.5:
            return coverage_path + spot_path
        else:
            return spot_path + coverage_path
    
    def _adjust_path_for_detections(self, base_path: List[Tuple[float, float]], 
                                  detection_history: List[Dict]) -> List[Tuple[float, float]]:
        """根据检测历史调整路径"""
        # 分析检测密度分布
        density_map = self._analyze_detection_density(detection_history)
        
        # 调整路径规划参数
        adjusted_path = []
        
        for i, point in enumerate(base_path):
            # 检查该区域的检测密度
            grid_x, grid_y = self.grid_map.world_to_grid(point[0], point[1])
            
            if (0 <= grid_x < self.grid_map.width and 
                0 <= grid_y < self.grid_map.height):
                
                local_density = density_map[grid_y, grid_x]
                
                # 根据密度调整采样频率
                if local_density > self.detection_density_threshold:
                    # 高密度区域：增加采样点
                    adjusted_path.append(point)
                    
                    if i < len(base_path) - 1:
                        # 在中间插入额外点
                        next_point = base_path[i + 1]
                        mid_x = (point[0] + next_point[0]) / 2
                        mid_y = (point[1] + next_point[1]) / 2
                        adjusted_path.append((mid_x, mid_y))
                else:
                    # 低密度区域：减少采样点
                    adjusted_path.append(point)
            else:
                adjusted_path.append(point)
        
        return adjusted_path
    
    def _analyze_detection_density(self, detection_history: List[Dict]) -> np.ndarray:
        """分析检测密度分布"""
        density_map = np.zeros((self.grid_map.height, self.grid_map.width))
        
        for detection in detection_history:
            bbox = detection.get('bbox', [])
            if len(bbox) >= 4:
                x, y, w, h = bbox[:4]
                
                # 更新密度图
                for dx in range(int(w)):
                    for dy in range(int(h)):
                        px, py = int(x + dx), int(y + dy)
                        if (0 <= px < self.grid_map.width and 
                            0 <= py < self.grid_map.height):
                            density_map[py, px] += 1
        
        # 归一化
        if density_map.max() > 0:
            density_map = density_map / density_map.max()
        
        return density_map

# 使用示例
if __name__ == "__main__":
    # 创建农田场景
    field = AgriculturalField(
        field_width=50.0,    # 50米宽
        field_height=100.0,   # 100米长
        row_spacing=0.8,     # 行距80cm
        plant_spacing=0.3     # 株距30cm
    )
    
    # 添加障碍物
    field.add_obstacle(20, 30, 5, 5)  # 灌溉设备
    field.add_obstacle(35, 60, 3, 3)  # 电线杆
    
    # 创建网格地图
    grid_map = GridMap(500, 1000, resolution=0.1)  # 50m x 100m, 10cm分辨率
    
    # 添加障碍物到网格地图
    for obstacle in field.obstacles:
        x1, y1 = int(obstacle['x'] / 0.1), int(obstacle['y'] / 0.1)
        x2, y2 = int((obstacle['x'] + obstacle['width']) / 0.1), \
                  int((obstacle['y'] + obstacle['height']) / 0.1)
        grid_map.set_obstacle_rectangle(x1, y1, x2, y2)
    
    # 测试全覆盖规划
    print("测试全覆盖路径规划:")
    coverage_planner = CoveragePathPlanner(field)
    coverage_path = coverage_planner.plan_boustrophedon((0.1, 0.1))
    
    print(f"覆盖路径点数: {len(coverage_path)}")
    print(f"前10个点: {coverage_path[:10]}")
    
    # 测试定点作业规划
    print("\n测试定点作业规划:")
    spot_planner = SpotTreatmentPlanner(field, grid_map)
    
    # 模拟检测结果
    detections = [
        {'class_name': 'weed', 'bbox': [100, 200, 20, 20]},
        {'class_name': 'disease', 'bbox': [300, 400, 15, 15]},
        {'class_name': 'weed', 'bbox': [200, 300, 25, 25]}
    ]
    
    inspection_path = spot_planner.plan_inspection_route(
        [(150, 210), (310, 410), (220, 320)],
        (0.1, 0.1)
    )
    
    print(f"巡检路径点数: {len(inspection_path)}")
    print(f"前10个点: {inspection_path[:10]}")
    
    # 测试自适应规划
    print("\n测试自适应路径规划:")
    adaptive_planner = AdaptivePathPlanner(field, grid_map)
    
    # 混合任务
    hybrid_path = adaptive_planner.plan_adaptive_mission("hybrid", {
        'start_pos': (0.1, 0.1),
        'detection_results': detections,
        'coverage_priority': 0.6
    })
    
    print(f"混合任务路径点数: {len(hybrid_path)}")
    print(f"前10个点: {hybrid_path[:10]}")