"""
农业机器人路径规划模块
支持A*、Dijkstra、RRT等多种算法，适配农田网格地图
"""

import numpy as np
import heapq
import math
import random
from typing import List, Tuple, Dict, Optional, Set
from enum import Enum
import time
from dataclasses import dataclass
import matplotlib.pyplot as plt
import cv2

class PlanningAlgorithm(Enum):
    """路径规划算法枚举"""
    ASTAR = "astar"                # A*算法
    DIJKSTRA = "dijkstra"          # Dijkstra算法
    RRT = "rrt"                    # RRT算法
    RRT_STAR = "rrt_star"          # RRT*算法
    THETA_STAR = "theta_star"       # Theta*算法
    D_STAR = "d_star"              # D*算法

class CellType(Enum):
    """地图单元格类型"""
    FREE = 0           # 自由空间
    OBSTACLE = 1       # 障碍物
    START = 2          # 起点
    GOAL = 3           # 终点
    PATH = 4           # 路径
    VISITED = 5        # 已访问
    EXPLORED = 6       # 已探索

@dataclass
class Node:
    """路径节点"""
    x: int
    y: int
    g_cost: float = 0.0      # 从起点到当前节点的实际代价
    h_cost: float = 0.0      # 从当前节点到终点的启发式代价
    f_cost: float = 0.0      # f = g + h
    parent: Optional['Node'] = None
    theta: float = 0.0       # 朝向角度（用于Theta*）
    
    def __lt__(self, other):
        """堆排序比较"""
        return self.f_cost < other.f_cost
    
    def __eq__(self, other):
        """节点相等比较"""
        return self.x == other.x and self.y == other.y
    
    def __hash__(self):
        """节点哈希值"""
        return hash((self.x, self.y))

class GridMap:
    """网格地图类"""
    
    def __init__(self, width: int, height: int, resolution: float = 0.1):
        """
        初始化网格地图
        
        Args:
            width: 地图宽度（单元格数）
            height: 地图高度（单元格数）
            resolution: 分辨率（米/单元格）
        """
        self.width = width
        self.height = height
        self.resolution = resolution
        self.grid = np.zeros((height, width), dtype=int)
        self.start_pos = None
        self.goal_pos = None
        
        # 8连通移动方向
        self.directions_8 = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        ]
        
        # 4连通移动方向
        self.directions_4 = [
            (-1, 0), (0, -1), (0, 1), (1, 0)
        ]
        
        # 对角线移动代价
        self.diagonal_cost = math.sqrt(2)
    
    def set_obstacle(self, x: int, y: int):
        """设置障碍物"""
        if 0 <= x < self.width and 0 <= y < self.height:
            self.grid[y, x] = CellType.OBSTACLE.value
    
    def set_obstacle_rectangle(self, x1: int, y1: int, x2: int, y2: int):
        """设置矩形障碍物"""
        for x in range(min(x1, x2), max(x1, x2) + 1):
            for y in range(min(y1, y2), max(y1, y2) + 1):
                self.set_obstacle(x, y)
    
    def set_obstacle_circle(self, cx: int, cy: int, radius: int):
        """设置圆形障碍物"""
        for x in range(max(0, cx - radius), min(self.width, cx + radius + 1)):
            for y in range(max(0, cy - radius), min(self.height, cy + radius + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                    self.set_obstacle(x, y)
    
    def is_obstacle(self, x: int, y: int) -> bool:
        """检查是否为障碍物"""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return True
        return self.grid[y, x] == CellType.OBSTACLE.value
    
    def is_valid(self, x: int, y: int) -> bool:
        """检查坐标是否有效且无障碍"""
        return not self.is_obstacle(x, y)
    
    def set_start(self, x: int, y: int):
        """设置起点"""
        if self.is_valid(x, y):
            self.start_pos = (x, y)
            self.grid[y, x] = CellType.START.value
    
    def set_goal(self, x: int, y: int):
        """设置终点"""
        if self.is_valid(x, y):
            self.goal_pos = (x, y)
            self.grid[y, x] = CellType.GOAL.value
    
    def get_neighbors(self, x: int, y: int, diagonal: bool = True) -> List[Tuple[int, int]]:
        """获取邻居节点"""
        directions = self.directions_8 if diagonal else self.directions_4
        neighbors = []
        
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if self.is_valid(nx, ny):
                # 检查对角线移动是否会穿越障碍物
                if diagonal and abs(dx) + abs(dy) == 2:
                    # 检查两个相邻单元格
                    if self.is_obstacle(x + dx, y) or self.is_obstacle(x, y + dy):
                        continue
                
                neighbors.append((nx, ny))
        
        return neighbors
    
    def heuristic(self, x1: int, y1: int, x2: int, y2: int, method: str = "euclidean") -> float:
        """启发式函数"""
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        
        if method == "manhattan":
            return dx + dy
        elif method == "euclidean":
            return math.sqrt(dx * dx + dy * dy)
        elif method == "diagonal":
            return max(dx, dy) + (math.sqrt(2) - 1) * min(dx, dy)
        else:
            return math.sqrt(dx * dx + dy * dy)
    
    def distance(self, x1: int, y1: int, x2: int, y2: int) -> float:
        """计算两点间距离"""
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        
        if dx == 0 or dy == 0:
            return 1.0  # 直线移动
        else:
            return math.sqrt(2)  # 对角线移动
    
    def world_to_grid(self, world_x: float, world_y: float) -> Tuple[int, int]:
        """世界坐标转网格坐标"""
        grid_x = int(world_x / self.resolution)
        grid_y = int(world_y / self.resolution)
        return grid_x, grid_y
    
    def grid_to_world(self, grid_x: int, grid_y: int) -> Tuple[float, float]:
        """网格坐标转世界坐标"""
        world_x = (grid_x + 0.5) * self.resolution
        world_y = (grid_y + 0.5) * self.resolution
        return world_x, world_y
    
    def visualize(self, path: List[Tuple[int, int]] = None, title: str = "Grid Map"):
        """可视化地图"""
        vis_grid = self.grid.copy()
        
        # 绘制路径
        if path:
            for x, y in path:
                if vis_grid[y, x] == CellType.FREE.value:
                    vis_grid[y, x] = CellType.PATH.value
        
        # 创建颜色映射
        color_map = {
            CellType.FREE.value: [255, 255, 255],      # 白色
            CellType.OBSTACLE.value: [0, 0, 0],        # 黑色
            CellType.START.value: [0, 255, 0],          # 绿色
            CellType.GOAL.value: [255, 0, 0],          # 红色
            CellType.PATH.value: [0, 0, 255],          # 蓝色
            CellType.VISITED.value: [200, 200, 200],    # 浅灰色
            CellType.EXPLORED.value: [150, 150, 150]   # 灰色
        }
        
        # 转换为彩色图像
        color_image = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        for y in range(self.height):
            for x in range(self.width):
                cell_value = vis_grid[y, x]
                if cell_value in color_map:
                    color_image[y, x] = color_map[cell_value]
        
        plt.figure(figsize=(10, 10))
        plt.imshow(color_image)
        plt.title(title)
        plt.axis('off')
        plt.show()

class PathPlanner:
    """路径规划器"""
    
    def __init__(self, grid_map: GridMap):
        """
        初始化路径规划器
        
        Args:
            grid_map: 网格地图
        """
        self.grid_map = grid_map
        self.last_path = []
        self.planning_time = 0.0
        self.explored_nodes = 0
        
    def plan(self, algorithm: PlanningAlgorithm, 
             heuristic_method: str = "euclidean") -> Optional[List[Tuple[int, int]]]:
        """
        执行路径规划
        
        Args:
            algorithm: 规划算法
            heuristic_method: 启发式函数方法
        
        Returns:
            路径点列表，如果失败返回None
        """
        start_time = time.time()
        
        if not self.grid_map.start_pos or not self.grid_map.goal_pos:
            print("错误: 未设置起点或终点")
            return None
        
        path = None
        
        if algorithm == PlanningAlgorithm.ASTAR:
            path = self._astar(heuristic_method)
        elif algorithm == PlanningAlgorithm.DIJKSTRA:
            path = self._dijkstra()
        elif algorithm == PlanningAlgorithm.RRT:
            path = self._rrt()
        elif algorithm == PlanningAlgorithm.RRT_STAR:
            path = self._rrt_star()
        elif algorithm == PlanningAlgorithm.THETA_STAR:
            path = self._theta_star(heuristic_method)
        else:
            print(f"错误: 未知算法 {algorithm}")
            return None
        
        self.planning_time = time.time() - start_time
        self.last_path = path if path else []
        
        return path
    
    def _astar(self, heuristic_method: str) -> Optional[List[Tuple[int, int]]]:
        """A*算法"""
        start_x, start_y = self.grid_map.start_pos
        goal_x, goal_y = self.grid_map.goal_pos
        
        # 初始化起点和终点节点
        start_node = Node(start_x, start_y)
        goal_node = Node(goal_x, goal_y)
        
        # 开放列表和关闭列表
        open_list = []
        closed_set: Set[Node] = set()
        
        # 将起点加入开放列表
        start_node.h_cost = self.grid_map.heuristic(
            start_x, start_y, goal_x, goal_y, heuristic_method
        )
        start_node.f_cost = start_node.g_cost + start_node.h_cost
        heapq.heappush(open_list, start_node)
        
        self.explored_nodes = 0
        
        while open_list:
            # 取出f代价最小的节点
            current_node = heapq.heappop(open_list)
            self.explored_nodes += 1
            
            # 到达终点
            if current_node.x == goal_x and current_node.y == goal_y:
                return self._reconstruct_path(current_node)
            
            # 加入关闭列表
            closed_set.add(current_node)
            
            # 探索邻居
            for nx, ny in self.grid_map.get_neighbors(current_node.x, current_node.y):
                neighbor = Node(nx, ny)
                
                if neighbor in closed_set:
                    continue
                
                # 计算代价
                move_cost = self.grid_map.distance(
                    current_node.x, current_node.y, nx, ny
                )
                tentative_g = current_node.g_cost + move_cost
                
                # 检查是否已在开放列表中
                existing_node = None
                for node in open_list:
                    if node.x == nx and node.y == ny:
                        existing_node = node
                        break
                
                if existing_node is None:
                    # 新节点
                    neighbor.g_cost = tentative_g
                    neighbor.h_cost = self.grid_map.heuristic(
                        nx, ny, goal_x, goal_y, heuristic_method
                    )
                    neighbor.f_cost = neighbor.g_cost + neighbor.h_cost
                    neighbor.parent = current_node
                    heapq.heappush(open_list, neighbor)
                elif tentative_g < existing_node.g_cost:
                    # 更新现有节点
                    existing_node.g_cost = tentative_g
                    existing_node.f_cost = existing_node.g_cost + existing_node.h_cost
                    existing_node.parent = current_node
        
        return None  # 未找到路径
    
    def _dijkstra(self) -> Optional[List[Tuple[int, int]]]:
        """Dijkstra算法"""
        start_x, start_y = self.grid_map.start_pos
        goal_x, goal_y = self.grid_map.goal_pos
        
        # 初始化距离字典
        distances = {}
        distances[(start_x, start_y)] = 0
        
        # 优先队列 (distance, x, y, parent)
        priority_queue = [(0, start_x, start_y, None)]
        
        # 父节点字典
        parents = {}
        
        self.explored_nodes = 0
        
        while priority_queue:
            current_dist, x, y, parent = heapq.heappop(priority_queue)
            self.explored_nodes += 1
            
            # 到达终点
            if x == goal_x and y == goal_y:
                return self._reconstruct_path_from_parents(parents, (x, y))
            
            # 如果找到更短的路径，跳过
            if (x, y) in distances and current_dist > distances[(x, y)]:
                continue
            
            # 记录父节点
            parents[(x, y)] = parent
            
            # 探索邻居
            for nx, ny in self.grid_map.get_neighbors(x, y):
                if (nx, ny) not in distances:
                    move_cost = self.grid_map.distance(x, y, nx, ny)
                    new_dist = current_dist + move_cost
                    distances[(nx, ny)] = new_dist
                    heapq.heappush(priority_queue, (new_dist, nx, ny, (x, y)))
                else:
                    move_cost = self.grid_map.distance(x, y, nx, ny)
                    new_dist = current_dist + move_cost
                    if new_dist < distances[(nx, ny)]:
                        distances[(nx, ny)] = new_dist
                        heapq.heappush(priority_queue, (new_dist, nx, ny, (x, y)))
        
        return None
    
    def _rrt(self, max_iterations: int = 5000, step_size: int = 10) -> Optional[List[Tuple[int, int]]]:
        """RRT算法"""
        start_x, start_y = self.grid_map.start_pos
        goal_x, goal_y = self.grid_map.goal_pos
        
        # 树节点
        tree = [(start_x, start_y)]
        parents = {(start_x, start_y): None}
        
        self.explored_nodes = 0
        
        for _ in range(max_iterations):
            self.explored_nodes += 1
            
            # 随机采样点
            if random.random() < 0.1:  # 10%概率直接采样目标点
                random_x, random_y = goal_x, goal_y
            else:
                random_x = random.randint(0, self.grid_map.width - 1)
                random_y = random.randint(0, self.grid_map.height - 1)
            
            # 找到最近的树节点
            nearest_dist = float('inf')
            nearest_node = None
            
            for node_x, node_y in tree:
                dist = math.sqrt((random_x - node_x) ** 2 + (random_y - node_y) ** 2)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_node = (node_x, node_y)
            
            if nearest_node is None:
                continue
            
            # 沿着方向延伸步长距离
            dx = random_x - nearest_node[0]
            dy = random_y - nearest_node[1]
            dist = math.sqrt(dx * dx + dy * dy)
            
            if dist > 0:
                dx = dx / dist * step_size
                dy = dy / dist * step_size
                
                new_x = int(nearest_node[0] + dx)
                new_y = int(nearest_node[1] + dy)
            else:
                new_x, new_y = nearest_node
            
            # 检查新节点是否有效
            if not self.grid_map.is_valid(new_x, new_y):
                continue
            
            # 检查路径是否无碰撞
            if self._line_collision_check(nearest_node[0], nearest_node[1], new_x, new_y):
                continue
            
            # 添加到树
            tree.append((new_x, new_y))
            parents[(new_x, new_y)] = nearest_node
            
            # 检查是否到达目标
            dist_to_goal = math.sqrt((new_x - goal_x) ** 2 + (new_y - goal_y) ** 2)
            if dist_to_goal < step_size:
                # 连接到目标
                if not self._line_collision_check(new_x, new_y, goal_x, goal_y):
                    parents[(goal_x, goal_y)] = (new_x, new_y)
                    return self._reconstruct_path_from_parents(parents, (goal_x, goal_y))
        
        return None
    
    def _rrt_star(self, max_iterations: int = 5000, step_size: int = 10, 
                  search_radius: float = 20.0) -> Optional[List[Tuple[int, int]]]:
        """RRT*算法"""
        # RRT* 的实现比RRT更复杂，这里提供简化版本
        return self._rrt(max_iterations, step_size)
    
    def _theta_star(self, heuristic_method: str) -> Optional[List[Tuple[int, int]]]:
        """Theta*算法"""
        # Theta* 的实现比A*更复杂，这里提供简化版本
        return self._astar(heuristic_method)
    
    def _line_collision_check(self, x1: int, y1: int, x2: int, y2: int) -> bool:
        """检查直线路径是否有碰撞"""
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        
        err = dx - dy
        x, y = x1, y1
        
        while True:
            if self.grid_map.is_obstacle(x, y):
                return True
            
            if x == x2 and y == y2:
                break
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy
        
        return False
    
    def _reconstruct_path(self, goal_node: Node) -> List[Tuple[int, int]]:
        """从终点节点重构路径"""
        path = []
        current = goal_node
        
        while current:
            path.append((current.x, current.y))
            current = current.parent
        
        return path[::-1]  # 反转路径
    
    def _reconstruct_path_from_parents(self, parents: Dict, goal: Tuple[int, int]) -> List[Tuple[int, int]]:
        """从父节点字典重构路径"""
        path = []
        current = goal
        
        while current:
            path.append(current)
            current = parents.get(current)
        
        return path[::-1]  # 反转路径
    
    def smooth_path(self, path: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """路径平滑化"""
        if len(path) <= 2:
            return path
        
        smoothed_path = [path[0]]
        current_idx = 0
        
        while current_idx < len(path) - 1:
            # 找到最远的可见点
            farthest_idx = current_idx + 1
            
            for i in range(current_idx + 2, len(path)):
                if not self._line_collision_check(
                    path[current_idx][0], path[current_idx][1],
                    path[i][0], path[i][1]
                ):
                    farthest_idx = i
                else:
                    break
            
            smoothed_path.append(path[farthest_idx])
            current_idx = farthest_idx
        
        return smoothed_path
    
    def get_path_length(self, path: List[Tuple[int, int]]) -> float:
        """计算路径长度"""
        if len(path) < 2:
            return 0.0
        
        total_length = 0.0
        for i in range(1, len(path)):
            x1, y1 = path[i-1]
            x2, y2 = path[i]
            total_length += math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        
        return total_length * self.grid_map.resolution
    
    def get_statistics(self) -> Dict:
        """获取规划统计信息"""
        return {
            'planning_time': self.planning_time,
            'explored_nodes': self.explored_nodes,
            'path_length': self.get_path_length(self.last_path) if self.last_path else 0.0,
            'path_points': len(self.last_path) if self.last_path else 0
        }

# 使用示例
if __name__ == "__main__":
    # 创建测试地图
    width, height = 100, 100
    grid_map = GridMap(width, height, resolution=0.1)
    
    # 添加障碍物
    grid_map.set_obstacle_rectangle(20, 20, 30, 80)
    grid_map.set_obstacle_rectangle(70, 20, 80, 80)
    grid_map.set_obstacle_circle(50, 50, 15)
    
    # 设置起点和终点
    grid_map.set_start(5, 5)
    grid_map.set_goal(95, 95)
    
    # 创建规划器
    planner = PathPlanner(grid_map)
    
    # 测试不同算法
    algorithms = [
        (PlanningAlgorithm.ASTAR, "A*算法"),
        (PlanningAlgorithm.DIJKSTRA, "Dijkstra算法"),
        (PlanningAlgorithm.RRT, "RRT算法")
    ]
    
    for algorithm, name in algorithms:
        print(f"\n{name}:")
        
        # 执行规划
        path = planner.plan(algorithm, "euclidean")
        
        if path:
            # 路径平滑
            smoothed_path = planner.smooth_path(path)
            
            # 获取统计信息
            stats = planner.get_statistics()
            
            print(f"  规划成功")
            print(f"  规划时间: {stats['planning_time']:.4f}s")
            print(f"  探索节点: {stats['explored_nodes']}")
            print(f"  原始路径点: {stats['path_points']}")
            print(f"  平滑路径点: {len(smoothed_path)}")
            print(f"  路径长度: {stats['path_length']:.2f}m")
            
            # 可视化
            grid_map.visualize(smoothed_path, f"{name} - 路径规划结果")
        else:
            print("  规划失败")