"""
数据库层
使用 MySQL 作为数据库，支持设施和指标的 CRUD 操作
"""
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager
import uuid
import os


class Database:
    """数据库管理类"""

    def __init__(
        self,
        host: str = None,
        port: int = 3306,
        user: str = None,
        password: str = None,
        database: str = None
    ):
        # 从环境变量或使用默认值
        self.host = host or os.getenv("MYSQL_HOST", "localhost")
        self.port = port or int(os.getenv("MYSQL_PORT", "3306"))
        self.user = user or os.getenv("MYSQL_USER", "root")
        self.password = password or os.getenv("MYSQL_PASSWORD", "zsl123456")
        self.database = database or os.getenv("MYSQL_DATABASE", "facilities_db")

        # 创建连接池
        self.connection_pool = pooling.MySQLConnectionPool(
            pool_name="facility_pool",
            pool_size=5,
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            database=self.database
        )
        self._init_db()

    @contextmanager
    def get_conn(self):
        """获取数据库连接的上下文管理器"""
        conn = self.connection_pool.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self):
        """初始化数据库表结构"""
        with self.get_conn() as conn:
            cursor = conn.cursor()
            # 创建设施表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS facilities (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    facility_type VARCHAR(100) NOT NULL,
                    parent_id VARCHAR(36),
                    description TEXT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY (parent_id) REFERENCES facilities(id) ON DELETE CASCADE
                )
            """)

            # 创建指标表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    unit VARCHAR(50),
                    data_type VARCHAR(50) NOT NULL DEFAULT 'float',
                    description TEXT,
                    facility_id VARCHAR(36) NOT NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
                )
            """)

            # 创建指标值表（用于存储时序数据）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS metric_values (
                    id VARCHAR(36) PRIMARY KEY,
                    metric_id VARCHAR(36) NOT NULL,
                    value TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE
                )
            """)

            # 创建索引以提高查询性能
            # MySQL 不支持 IF NOT EXISTS，需要先检查或忽略错误
            for index_sql in [
                "CREATE INDEX idx_facilities_parent_id ON facilities(parent_id)",
                "CREATE INDEX idx_facilities_type ON facilities(facility_type)",
                "CREATE INDEX idx_metrics_facility_id ON metrics(facility_id)",
                "CREATE INDEX idx_metric_values_metric_id ON metric_values(metric_id)"
            ]:
                try:
                    cursor.execute(index_sql)
                except mysql.connector.Error as err:
                    # 忽略索引已存在的错误
                    if err.errno != 1061:  # ER_DUP_KEYNAME
                        raise

    # ==================== 设施相关操作 ====================

    def create_facility(
        self,
        name: str,
        facility_type: str,
        parent_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建设施"""
        facility_id = str(uuid.uuid4())
        now = datetime.utcnow()

        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO facilities (id, name, facility_type, parent_id, description, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (facility_id, name, facility_type, parent_id, description, now, now)
            )

        return {
            "id": facility_id,
            "name": name,
            "facility_type": facility_type,
            "parent_id": parent_id,
            "description": description,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }

    def get_facility(self, facility_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取设施"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM facilities WHERE id = %s",
                (facility_id,)
            )
            row = cursor.fetchone()
            if row:
                # 转换 datetime 为 ISO 格式字符串
                return self._convert_datetime(row)
            return None

    def get_facility_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """根据名称获取设施"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM facilities WHERE name = %s",
                (name,)
            )
            row = cursor.fetchone()
            if row:
                return self._convert_datetime(row)
            return None

    def get_all_facilities(self, facility_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取所有设施"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            if facility_type:
                cursor.execute(
                    "SELECT * FROM facilities WHERE facility_type = %s ORDER BY created_at",
                    (facility_type,)
                )
            else:
                cursor.execute(
                    "SELECT * FROM facilities ORDER BY created_at"
                )
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    def get_children(self, parent_id: str) -> List[Dict[str, Any]]:
        """获取子设施列表"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM facilities WHERE parent_id = %s ORDER BY name",
                (parent_id,)
            )
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    def update_facility(
        self,
        facility_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> bool:
        """更新设施信息"""
        updates = []
        params = []

        if name is not None:
            updates.append("name = %s")
            params.append(name)
        if description is not None:
            updates.append("description = %s")
            params.append(description)

        if not updates:
            return False

        updates.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.append(facility_id)

        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE facilities SET {', '.join(updates)} WHERE id = %s",
                params
            )
            return cursor.rowcount > 0

    def delete_facility(self, facility_id: str) -> bool:
        """删除设施（级联删除子设施和指标）"""
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM facilities WHERE id = %s", (facility_id,))
            return cursor.rowcount > 0

    def build_facility_path(self, facility_id: str) -> str:
        """构建设施路径（如：数据中心A/房间1/传感器X）"""
        path_parts = []
        current_id = facility_id

        while current_id:
            facility = self.get_facility(current_id)
            if not facility:
                break
            path_parts.insert(0, facility["name"])
            current_id = facility.get("parent_id")

        return "/".join(path_parts)

    def get_root_facilities(self) -> List[Dict[str, Any]]:
        """获取根设施（没有父设施的设施）"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM facilities WHERE parent_id IS NULL ORDER BY name"
            )
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    # ==================== 指标相关操作 ====================

    def create_metric(
        self,
        name: str,
        facility_id: str,
        unit: Optional[str] = None,
        data_type: str = "float",
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建指标"""
        metric_id = str(uuid.uuid4())
        now = datetime.utcnow()

        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO metrics (id, name, unit, data_type, description, facility_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (metric_id, name, unit, data_type, description, facility_id, now, now)
            )

        return {
            "id": metric_id,
            "name": name,
            "unit": unit,
            "data_type": data_type,
            "description": description,
            "facility_id": facility_id,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }

    def get_metric(self, metric_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取指标"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM metrics WHERE id = %s",
                (metric_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._convert_datetime(row)
            return None

    def get_metrics_by_facility(self, facility_id: str) -> List[Dict[str, Any]]:
        """获取设施的所有指标"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM metrics WHERE facility_id = %s ORDER BY name",
                (facility_id,)
            )
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    def get_all_metrics(self) -> List[Dict[str, Any]]:
        """获取所有指标"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM metrics ORDER BY created_at")
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    def update_metric(
        self,
        metric_id: str,
        name: Optional[str] = None,
        unit: Optional[str] = None,
        description: Optional[str] = None
    ) -> bool:
        """更新指标信息"""
        updates = []
        params = []

        if name is not None:
            updates.append("name = %s")
            params.append(name)
        if unit is not None:
            updates.append("unit = %s")
            params.append(unit)
        if description is not None:
            updates.append("description = %s")
            params.append(description)

        if not updates:
            return False

        updates.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.append(metric_id)

        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE metrics SET {', '.join(updates)} WHERE id = %s",
                params
            )
            return cursor.rowcount > 0

    def delete_metric(self, metric_id: str) -> bool:
        """删除指标"""
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM metrics WHERE id = %s", (metric_id,))
            return cursor.rowcount > 0

    # ==================== 指标值相关操作 ====================

    def create_metric_value(
        self,
        metric_id: str,
        value: str,
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建指标值记录"""
        value_id = str(uuid.uuid4())
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()

        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO metric_values (id, metric_id, value, timestamp)
                VALUES (%s, %s, %s, %s)
                """,
                (value_id, metric_id, value, timestamp)
            )

        return {
            "id": value_id,
            "metric_id": metric_id,
            "value": value,
            "timestamp": timestamp
        }

    def get_metric_values(
        self,
        metric_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """获取指标的历史值"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT * FROM metric_values
                WHERE metric_id = %s
                ORDER BY timestamp DESC
                LIMIT %s OFFSET %s
                """,
                (metric_id, limit, offset)
            )
            return [self._convert_datetime(row) for row in cursor.fetchall()]

    def get_latest_metric_value(self, metric_id: str) -> Optional[Dict[str, Any]]:
        """获取指标的最新值"""
        with self.get_conn() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT * FROM metric_values
                WHERE metric_id = %s
                ORDER BY timestamp DESC
                LIMIT 1
                """,
                (metric_id,)
            )
            row = cursor.fetchone()
            if row:
                return self._convert_datetime(row)
            return None

    def _convert_datetime(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """将 datetime 对象转换为 ISO 格式字符串"""
        result = {}
        for key, value in row.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result


# 全局数据库实例
db = Database()
