import sys
import os
from flask import Flask, request, jsonify
from datetime import time
import logging
from flask_cors import CORS

# 获取 models.py 所在的目录
src_dir = r'C:\Users\zhajiyoubing\Documents\排课系统后端代码\g-aahz0969-intellclass_system-AutoTimetable-\src'
# 将该目录添加到 sys.path
sys.path.append(src_dir)

from models import ScheduleConfig, TimeTable, WeekDay, Class, Teacher, Classroom, Subject, DayPart, TimeSlot
from scheduler import SchedulerService
from rules import RuleManager

# 配置日志
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
# 解决跨域问题，允许所有来源请求（生产环境建议指定来源）
CORS(app)

# 创建排课配置
config = ScheduleConfig(
    name="示例课表",
    weekdays=[WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY,
              WeekDay.THURSDAY, WeekDay.FRIDAY],
    timetable=TimeTable(
        class_duration=45,
        break_duration=10,
        morning_start=time(8, 0),
        afternoon_start=time(14, 0),
        periods_per_morning=4,
        periods_per_afternoon=4
    )
)

# 创建规则管理器
rule_manager = RuleManager()
rule_manager.create_default_rules()

# 创建排课服务
scheduler_service = SchedulerService(config, rule_manager)


@app.route('/create_schedule', methods=['POST'])
def create_schedule():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "errors": ["请求数据为空"]}), 400
        classes = []
        teachers = []
        classrooms = []

        # 解析班级数据
        for class_data in data.get('classes', []):
            subjects = [Subject(
                name=subj['name'],
                category=subj['category'],
                weekly_hours=subj['weekly_hours'],
                priority=subj.get('priority', 1),
                requires_consecutive_periods=subj.get('requires_consecutive_periods', False),
                max_periods_per_day=subj.get('max_periods_per_day', 2),
                allowed_day_parts=[DayPart[part.upper()] for part in subj.get('allowed_day_parts', ['MORNING', 'AFTERNOON'])],
                conflicting_subjects=set(subj.get('conflicting_subjects', [])),
                required_room_types=set(subj.get('required_room_types', []))
            ) for subj in class_data['subjects']]
            new_class = Class(
                grade=class_data['grade'],
                name=class_data['name'],
                student_count=class_data['student_count'],
                subjects=subjects
            )
            classes.append(new_class)

        # 解析教师数据
        for teacher_data in data.get('teachers', []):
            new_teacher = Teacher(
                id=teacher_data['id'],
                name=teacher_data['name'],
                subjects=teacher_data['subjects']
            )
            teachers.append(new_teacher)

        # 解析教室数据
        for classroom_data in data.get('classrooms', []):
            available_times = []
            for time_slot in classroom_data.get('available_times', []):
                try:
                    available_times.append(TimeSlot(
                        weekday=WeekDay[time_slot['weekday'].upper()],
                        start_time=time.fromisoformat(time_slot['start_time']),
                        end_time=time.fromisoformat(time_slot['end_time']),
                        period_number=time_slot['period_number'],
                        day_part=DayPart[time_slot['day_part'].upper()]
                    ))
                except ValueError:
                    logging.error(f"Invalid time format in time slot: {time_slot}")
            new_classroom = Classroom(
                id=classroom_data['id'],
                name=classroom_data['name'],
                floor=classroom_data['floor'],
                location=classroom_data['location'],
                room_type=classroom_data['room_type'],
                capacity=classroom_data['capacity'],
                is_special=classroom_data.get('is_special', False),
                equipment=set(classroom_data.get('equipment', [])),
                available_times=available_times
            )
            classrooms.append(new_classroom)

        result = scheduler_service.create_schedule(classes, teachers, classrooms)
        return jsonify(result)
    except Exception as e:
        logging.error(f"处理排课请求时发生错误: {str(e)}")
        return jsonify({"success": False, "errors": [f"系统错误: {str(e)}"]}), 500


if __name__ == '__main__':
    app.run(debug=True)