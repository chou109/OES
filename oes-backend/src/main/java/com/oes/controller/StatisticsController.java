package com.oes.controller;

import com.oes.common.base.R;
import com.oes.config.JwtUtils;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamPaper;
import com.oes.entity.ExamQuestion;
import com.oes.service.ExamExamService;
import com.oes.service.ExamPaperService;
import com.oes.service.ExamQuestionService;
import com.oes.service.SysClassService;
import com.oes.service.SysClassMemberService;
import com.oes.service.SysDepartmentService;
import com.oes.service.SysUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final SysUserService sysUserService;
    private final ExamExamService examExamService;
    private final SysClassService sysClassService;
    private final SysClassMemberService classMemberService;
    private final SysDepartmentService sysDepartmentService;
    private final ExamPaperService examPaperService;
    private final ExamQuestionService examQuestionService;
    private final JwtUtils jwtUtils;

    public StatisticsController(SysUserService sysUserService, ExamExamService examExamService,
                               SysClassService sysClassService, SysClassMemberService classMemberService,
                               SysDepartmentService sysDepartmentService,
                               ExamPaperService examPaperService, ExamQuestionService examQuestionService,
                               JwtUtils jwtUtils) {
        this.sysUserService = sysUserService;
        this.examExamService = examExamService;
        this.classMemberService = classMemberService;
        this.sysClassService = sysClassService;
        this.sysDepartmentService = sysDepartmentService;
        this.examPaperService = examPaperService;
        this.examQuestionService = examQuestionService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/overview")
    public R<Map<String, Object>> getOverview() {
        Map<String, Object> data = new HashMap<>();

        Long studentCount = sysUserService.countByRole("STUDENT");
        Long teacherCount = sysUserService.countByRole("TEACHER");
        Long adminCount = sysUserService.countByRole("ADMIN");
        Long totalExams = examExamService.count();
        Long classCount = sysClassService.count();
        Long departmentCount = sysDepartmentService.count();
        Long paperCount = examPaperService.count();
        Long questionCount = examQuestionService.count();

        // 考试状态统计
        Long pendingExams = examExamService.countByStatus("PENDING");
        Long ongoingExams = examExamService.countByStatus("ONGOING");
        Long finishedExams = examExamService.countByStatus("FINISHED");

        // 参与人次（已提交的考试记录数）
        Long participationCount = examExamService.countParticipation();

        data.put("studentCount", studentCount);
        data.put("teacherCount", teacherCount);
        data.put("adminCount", adminCount);
        data.put("totalUsers", studentCount + teacherCount + adminCount);
        data.put("totalExams", totalExams);
        data.put("examCount", totalExams);
        data.put("classCount", classCount);
        data.put("departmentCount", departmentCount);
        data.put("paperCount", paperCount);
        data.put("questionCount", questionCount);
        data.put("pendingExams", pendingExams);
        data.put("ongoingExams", ongoingExams);
        data.put("finishedExams", finishedExams);
        data.put("participationCount", participationCount);

        return R.ok(data);
    }

    @GetMapping("/teacher/stats")
    public R<Map<String, Object>> getTeacherStats(HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long teacherId = jwtUtils.getUserIdFromToken(token);

        Map<String, Object> stats = new HashMap<>();

        // 教师创建的试卷数
        Long paperCount = examPaperService.count(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExamPaper>()
                .eq(ExamPaper::getCreatorId, teacherId));
        stats.put("paperCount", paperCount);

        // 教师创建的题目数
        Long questionCount = examQuestionService.count(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExamQuestion>()
                .eq(ExamQuestion::getCreatorId, teacherId));
        stats.put("questionCount", questionCount);

        // 教师创建的考试数（通过试卷关联）
        List<ExamPaper> papers = examPaperService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExamPaper>()
                .eq(ExamPaper::getCreatorId, teacherId));
        if (!papers.isEmpty()) {
            Long examCount = examExamService.count(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ExamExam>()
                    .in(ExamExam::getPaperId, papers.stream().map(ExamPaper::getId).collect(java.util.stream.Collectors.toList())));
            stats.put("examCount", examCount);
        } else {
            stats.put("examCount", 0L);
        }

        // 教师关联的班级数（通过班级成员表查询）
        List<com.oes.entity.SysClassMember> members = classMemberService.getMemberByUserId(teacherId);
        Long classCount = members.stream()
                .map(com.oes.entity.SysClassMember::getClassId)
                .distinct()
                .count();
        stats.put("classCount", classCount);

        return R.ok(stats);
    }
}
