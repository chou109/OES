package com.oes.controller;

import com.oes.common.base.PageResult;
import com.oes.common.base.R;
import com.oes.entity.ExamQuestion;
import com.oes.service.ExamQuestionService;
import com.oes.config.JwtUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
public class ExamQuestionController {

    private final ExamQuestionService examQuestionService;
    private final JwtUtils jwtUtils;

    public ExamQuestionController(ExamQuestionService examQuestionService, JwtUtils jwtUtils) {
        this.examQuestionService = examQuestionService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping("/page")
    public R<PageResult<ExamQuestion>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String keyword) {
        return R.ok(examQuestionService.page(current, size, subjectId, type, difficulty, keyword));
    }

    @GetMapping("/{id}")
    public R<ExamQuestion> getById(@PathVariable Long id) {
        return R.ok(examQuestionService.getById(id));
    }

    @GetMapping("/list")
    public R<List<ExamQuestion>> list(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Integer count,
            @RequestParam(required = false) String knowledgePointIds) {
        return R.ok(examQuestionService.randomQuestions(subjectId, type, difficulty, count, knowledgePointIds));
    }

    @PostMapping
    public R<Void> create(@RequestBody ExamQuestion question) {
        examQuestionService.save(question);
        return R.ok();
    }

    @PutMapping
    public R<Void> update(@RequestBody ExamQuestion question) {
        examQuestionService.updateById(question);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        examQuestionService.removeById(id);
        return R.ok();
    }

    @GetMapping("/{id}/correct-rate")
    public R<Double> getCorrectRate(@PathVariable Long id) {
        return R.ok(examQuestionService.getCorrectRate(id));
    }

    /**
     * 批量导入题目（从文本识别）
     */
    @PostMapping("/import")
    public R<Map<String, Object>> importQuestions(
            @RequestBody Map<String, Object> params,
            HttpServletRequest request) {
        String text = (String) params.get("text");
        Long subjectId = params.get("subjectId") != null ? ((Number) params.get("subjectId")).longValue() : null;
        
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long creatorId = jwtUtils.getUserIdFromToken(token);
        
        return R.ok(examQuestionService.importFromText(text, subjectId, creatorId));
    }

    /**
     * 自动组卷
     */
    @PostMapping("/generate-paper")
    public R<Map<String, Object>> generatePaper(
            @RequestBody Map<String, Object> params,
            HttpServletRequest request) {
        String title = (String) params.get("title");
        Long subjectId = params.get("subjectId") != null ? ((Number) params.get("subjectId")).longValue() : null;
        Integer totalScore = params.get("totalScore") != null ? ((Number) params.get("totalScore")).intValue() : null;
        Integer duration = params.get("duration") != null ? ((Number) params.get("duration")).intValue() : null;
        Integer passScore = params.get("passScore") != null ? ((Number) params.get("passScore")).intValue() : null;
        String knowledgePointIds = (String) params.get("knowledgePointIds");
        
        @SuppressWarnings("unchecked")
        Map<String, Integer> questionCountMap = (Map<String, Integer>) params.get("questionCountMap");
        
        String token = request.getHeader("Authorization").replace("Bearer ", "");
        Long creatorId = jwtUtils.getUserIdFromToken(token);
        
        return R.ok(examQuestionService.autoGeneratePaper(title, subjectId, questionCountMap, totalScore, duration, passScore, creatorId, knowledgePointIds));
    }
}
