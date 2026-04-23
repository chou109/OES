package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.common.base.BaseEntity;
import com.oes.config.JwtUtils;
import com.oes.entity.ExamQuestion;
import com.oes.entity.ExamWrongQuestion;
import com.oes.mapper.ExamWrongQuestionMapper;
import com.oes.service.ExamQuestionService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import javax.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wrong-questions")
public class ExamWrongQuestionController {

    private final ExamWrongQuestionMapper examWrongQuestionMapper;
    private final ExamQuestionService examQuestionService;
    private final JwtUtils jwtUtils;

    public ExamWrongQuestionController(ExamWrongQuestionMapper examWrongQuestionMapper,
                                       ExamQuestionService examQuestionService,
                                       JwtUtils jwtUtils) {
        this.examWrongQuestionMapper = examWrongQuestionMapper;
        this.examQuestionService = examQuestionService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/page")
    public R<PageResult<Map<String, Object>>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long subjectId,
            HttpServletRequest request) {
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long studentId = jwtUtils.getUserIdFromToken(token);

        Page<ExamWrongQuestion> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamWrongQuestion> wrapper = new LambdaQueryWrapper<ExamWrongQuestion>()
                .eq(ExamWrongQuestion::getStudentId, studentId)
                .orderByDesc(ExamWrongQuestion::getCreateTime);

        IPage<ExamWrongQuestion> result = examWrongQuestionMapper.selectPage(page, wrapper);

        List<Map<String, Object>> records = result.getRecords().stream().map(wq -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", wq.getId());
            map.put("questionId", wq.getQuestionId());
            map.put("wrongAnswer", wq.getWrongAnswer());
            map.put("correctAnswer", wq.getCorrectAnswer());
            map.put("practicedCount", wq.getPracticedCount());
            map.put("lastPracticeTime", wq.getLastPracticeTime());

            ExamQuestion question = examQuestionService.getById(wq.getQuestionId());
            if (question != null) {
                map.put("content", question.getContent());
                map.put("type", question.getType());
                map.put("options", question.getOptions());
                map.put("analysis", question.getAnalysis());
                map.put("subjectId", question.getSubjectId());
            }
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return R.ok(new PageResult<>(result.getTotal(), records, (long) current, (long) size));
    }

    @GetMapping("/{id}")
    public R<ExamWrongQuestion> getById(@PathVariable Long id) {
        return R.ok(examWrongQuestionMapper.selectById(id));
    }

    @PostMapping("/{id}/practice")
    public R<Void> practice(@PathVariable Long id) {
        ExamWrongQuestion wq = examWrongQuestionMapper.selectById(id);
        if (wq != null) {
            wq.setPracticedCount(wq.getPracticedCount() + 1);
            wq.setLastPracticeTime(LocalDateTime.now());
            examWrongQuestionMapper.updateById(wq);
        }
        return R.ok();
    }
}