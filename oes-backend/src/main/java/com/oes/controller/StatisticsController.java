package com.oes.controller;

import com.oes.common.base.R;
import com.oes.service.ExamExamService;
import com.oes.service.SysUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final SysUserService sysUserService;
    private final ExamExamService examExamService;

    public StatisticsController(SysUserService sysUserService, ExamExamService examExamService) {
        this.sysUserService = sysUserService;
        this.examExamService = examExamService;
    }

    @GetMapping("/overview")
    public R<Map<String, Object>> getOverview() {
        Map<String, Object> data = new HashMap<>();

        Long studentCount = sysUserService.countByRole("STUDENT");
        Long teacherCount = sysUserService.countByRole("TEACHER");
        Long totalExams = examExamService.count();

        data.put("studentCount", studentCount);
        data.put("teacherCount", teacherCount);
        data.put("totalExams", totalExams);
        data.put("totalUsers", studentCount + teacherCount + 1);

        return R.ok(data);
    }
}
