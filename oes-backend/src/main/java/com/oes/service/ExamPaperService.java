package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamPaper;
import com.oes.entity.ExamQuestion;
import com.oes.mapper.ExamPaperMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExamPaperService extends ServiceImpl<ExamPaperMapper, ExamPaper> {

    private final ExamQuestionService examQuestionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExamPaperService(ExamQuestionService examQuestionService) {
        this.examQuestionService = examQuestionService;
    }

    public PageResult<ExamPaper> page(Integer current, Integer size, Long subjectId, String status, String keyword) {
        Page<ExamPaper> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamPaper> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamPaper::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(ExamPaper::getStatus, status);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ExamPaper::getTitle, keyword);
        }
        wrapper.orderByDesc(ExamPaper::getCreateTime);
        IPage<ExamPaper> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public boolean createPaper(ExamPaper paper, List<Long> questionIds, Map<Long, Integer> questionScores) {
        if (questionIds != null && !questionIds.isEmpty()) {
            paper.setQuestionIds(String.join(",", questionIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.toList())));
            paper.setQuestionCount(questionIds.size());

            // 计算总分：优先使用传入的分数，否则使用题目默认分数
            int totalScore = 0;
            for (Long qId : questionIds) {
                Integer score = (questionScores != null) ? questionScores.get(qId) : null;
                if (score == null) {
                    ExamQuestion q = examQuestionService.getById(qId);
                    score = (q != null && q.getScore() != null) ? q.getScore() : 5;
                }
                totalScore += score;
                examQuestionService.incrementUsedCount(qId);
            }
            paper.setTotalScore(totalScore);
        }
        paper.setStatus("DRAFT");
        return save(paper);
    }

    public boolean updatePaper(ExamPaper paper, List<Long> questionIds, Map<Long, Integer> questionScores) {
        if (questionIds != null && !questionIds.isEmpty()) {
            paper.setQuestionIds(String.join(",", questionIds.stream()
                    .map(String::valueOf)
                    .collect(Collectors.toList())));
            paper.setQuestionCount(questionIds.size());

            // 计算总分：优先使用传入的分数，否则使用题目默认分数
            int totalScore = 0;
            for (Long qId : questionIds) {
                Integer score = (questionScores != null) ? questionScores.get(qId) : null;
                if (score == null) {
                    ExamQuestion q = examQuestionService.getById(qId);
                    score = (q != null && q.getScore() != null) ? q.getScore() : 5;
                }
                totalScore += score;
            }
            paper.setTotalScore(totalScore);
        }
        return updateById(paper);
    }

    public boolean publishPaper(Long paperId) {
        ExamPaper paper = getById(paperId);
        if (paper == null) {
            throw new RuntimeException("试卷不存在");
        }
        if (paper.getQuestionCount() == null || paper.getQuestionCount() == 0) {
            throw new RuntimeException("试卷没有题目，无法发布");
        }
        paper.setStatus("PUBLISHED");
        return updateById(paper);
    }

    public List<Long> getQuestionIds(ExamPaper paper) {
        if (!StringUtils.hasText(paper.getQuestionIds())) {
            return new ArrayList<>();
        }
        
        String questionIds = paper.getQuestionIds();
        
        // 尝试判断格式：如果是JSON数组格式
        if (questionIds.startsWith("[")) {
            try {
                List<Map<String, Object>> list = objectMapper.readValue(questionIds, 
                    new TypeReference<List<Map<String, Object>>>() {});
                return list.stream()
                        .map(item -> ((Number) item.get("questionId")).longValue())
                        .collect(Collectors.toList());
            } catch (JsonProcessingException e) {
                // JSON解析失败，尝试旧格式
            }
        }
        
        // 旧格式：逗号分隔的ID字符串
        return Arrays.stream(questionIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    public List<ExamQuestion> getQuestions(ExamPaper paper) {
        List<Long> ids = getQuestionIds(paper);
        return examQuestionService.listByIds(ids);
    }

    public ExamPaper getWithQuestions(Long paperId) {
        ExamPaper paper = getById(paperId);
        if (paper != null) {
            List<ExamQuestion> questions = getQuestions(paper);
            try {
                paper.setQuestionIds(objectMapper.writeValueAsString(questions));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("JSON序列化失败", e);
            }
        }
        return paper;
    }
}