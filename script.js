document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const navbar = document.getElementById('navbar');
    const createTimetableForm = document.getElementById('createTimetableForm');
    const timetableCreation = document.getElementById('timetable-creation');
    const timetableOverview = document.getElementById('timetable-overview');

    // 模拟登录验证
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 这里简单模拟登录成功，实际应与后端交互验证
        if (username && password) {
            loginContainer.style.display = 'none';
            navbar.style.display = 'block';
            timetableCreation.style.display = 'block';
        }
    });

    // 导航栏点击事件处理
    navbar.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
            const target = e.target.getAttribute('data-target');
            if (target) {
                document.querySelectorAll('.content').forEach(function (element) {
                    element.style.display = 'none';
                });
                document.getElementById(target).style.display = 'block';
            }
        }
    });

    // 为课表创建表单添加提交事件监听器
    createTimetableForm.addEventListener('submit', function (e) {
        e.preventDefault(); // 阻止表单默认的提交行为

        // 获取表单数据
        const timetableName = document.getElementById('timetable-name').value;
        const classDays = document.getElementById('上课周期').value;
        const morningPeriods = document.getElementById('上午节次').value;
        const afternoonPeriods = document.getElementById('下午节次').value;
        const gradeClass = document.getElementById('年级班级').value;
        const subject = document.getElementById('科目').value;
        const teacher = document.getElementById('老师').value;
        const classroom = document.getElementById('教室').value;

        // 整理请求数据，根据后端接口要求构建数据结构
        const requestData = {
            classes: [
                {
                    "grade": gradeClass,
                    "name": gradeClass,
                    "student_count": 0, // 这里暂时设为 0，可根据实际情况修改
                    "subjects": [
                        {
                            "name": subject,
                            "category": "未知", // 这里暂时设为未知，可根据实际情况修改
                            "weekly_hours": 1, // 这里暂时设为 1，可根据实际情况修改
                            "priority": 1,
                            "requires_consecutive_periods": false,
                            "max_periods_per_day": 1
                        }
                    ]
                }
            ],
            teachers: [
                {
                    "id": "T001", // 这里暂时设为 T001，可根据实际情况修改
                    "name": teacher,
                    "subjects": [subject]
                }
            ],
            classrooms: [
                {
                    "id": "R001", // 这里暂时设为 R001，可根据实际情况修改
                    "name": classroom,
                    "floor": 1, // 这里暂时设为 1，可根据实际情况修改
                    "location": "未知", // 这里暂时设为未知，可根据实际情况修改
                    "room_type": "普通教室", // 这里暂时设为普通教室，可根据实际情况修改
                    "capacity": 0, // 这里暂时设为 0，可根据实际情况修改
                    "is_special": false
                }
            ]
        };

        // 使用 axios 发送 POST 请求到后端接口
        axios.post('http://127.0.0.1:5000/create_schedule', requestData)
           .then(response => {
                if (response.data.success) {
                    const scheduleData = response.data.schedule;
                    let newPage = `
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>课表页面</title>
                            <style>
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                table th, table td {
                                    border: 1px solid #e0e0e0;
                                    padding: 12px;
                                    text-align: left;
                                    font-size: 16px;
                                }
                                table th {
                                    background-color: #f5f7f9;
                                    color: #333;
                                }
                            </style>
                        </head>
                        <body>
                            <h2 style="text-align: center; color: #0052CC; font-size: 34px; font-weight: 700;">排课总览</h2>
                            <table>
                                <tr>
                                    <th>班级</th>
                                    <th>科目</th>
                                    <th>教师</th>
                                    <th>教室</th>
                                    <th>星期</th>
                                    <th>节次</th>
                                    <th>时间</th>
                                </tr>
                    `;
                    scheduleData.forEach(entry => {
                        newPage += `
                                <tr>
                                    <td>${entry.class}</td>
                                    <td>${entry.subject}</td>
                                    <td>${entry.teacher}</td>
                                    <td>${entry.classroom}</td>
                                    <td>${entry.weekday}</td>
                                    <td>${entry.period}</td>
                                    <td>${entry.time}</td>
                                </tr>
                        `;
                    });
                    newPage += `
                            </table>
                        </body>
                        </html>
                    `;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = newPage;
                    console.log('即将写入新窗口的 HTML 内容:', tempDiv.innerHTML);
                    const newWindow = window.open('', '_blank');
                    console.log('新窗口 document 对象:', newWindow.document);
                    newWindow.document.write(tempDiv.innerHTML);
                    newWindow.document.close();
                    console.log('新窗口内容写入完成');
                    timetableOverview.style.display = 'block';
                } else {
                    console.error('课表创建失败', response.data.errors);
                }
            })
           .catch(error => {
                console.error('请求错误:', error);
            });
    });
});