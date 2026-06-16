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
            StringBuilder scoresBuilder = new StringBuilder();
            for (Long qId : questionIds) {
                Integer score = (questionScores != null) ? questionScores.get(qId) : null;
                if (score == null) {
                    ExamQuestion q = examQuestionService.getById(qId);
                    score = (q != null && q.getScore() != null) ? q.getScore() : 5;
                }
                totalScore += score;
                examQuestionService.incrementUsedCount(qId);
                // 保存分值信息
                if (scoresBuilder.length() > 0) scoresBuilder.append(",");
                scoresBuilder.append(qId).append(":").append(score);
            }
            paper.setTotalScore(totalScore);
            paper.setQuestionScores(scoresBuilder.toString());
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
            StringBuilder scoresBuilder = new StringBuilder();
            for (Long qId : questionIds) {
                Integer score = (questionScores != null) ? questionScores.get(qId) : null;
                if (score == null) {
                    ExamQuestion q = examQuestionService.getById(qId);
                    score = (q != null && q.getScore() != null) ? q.getScore() : 5;
                }
                totalScore += score;
                // 保存分值信息
                if (scoresBuilder.length() > 0) scoresBuilder.append(",");
                scoresBuilder.append(qId).append(":").append(score);
            }
            paper.setTotalScore(totalScore);
            paper.setQuestionScores(scoresBuilder.toString());
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
        List<ExamQuestion> questions = examQuestionService.listByIds(ids);
        
        // 创建题目ID到题目对象的映射
        Map<Long, ExamQuestion> questionMap = new java.util.HashMap<>();
        for (ExamQuestion q : questions) {
            questionMap.put(q.getId(), q);
        }
        
        // 优先从JSON格式的questionIds中获取分值（自动组卷格式）
        String questionIds = paper.getQuestionIds();
        if (questionIds != null && questionIds.startsWith("[")) {
            try {
                List<Map<String, Object>> list = objectMapper.readValue(questionIds, 
                    new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> item : list) {
                    Long qId = ((Number) item.get("questionId")).longValue();
                    Integer score = item.get("score") != null ? ((Number) item.get("score")).intValue() : null;
                    ExamQuestion q = questionMap.get(qId);
                    if (q != null && score != null) {
                        q.setScore(score);
                    }
                }
                return questions;
            } catch (JsonProcessingException e) {
                // JSON解析失败，继续尝试其他方式
            }
        }
        
        // 如果试卷中有存储分值信息，设置到题目对象中（手动组卷格式）
        if (paper.getQuestionScores() != null && !paper.getQuestionScores().isEmpty()) {
            Map<Long, Integer> scoreMap = parseQuestionScores(paper.getQuestionScores());
            for (ExamQuestion q : questions) {
                Integer score = scoreMap.get(q.getId());
                if (score != null) {
                    q.setScore(score);
                }
            }
        }
        
        return questions;
    }
    
    private Map<Long, Integer> parseQuestionScores(String questionScores) {
        Map<Long, Integer> scoreMap = new java.util.HashMap<>();
        if (questionScores != null && !questionScores.isEmpty()) {
            String[] pairs = questionScores.split(",");
            for (String pair : pairs) {
                String[] parts = pair.split(":");
                if (parts.length == 2) {
                    try {
                        Long qId = Long.parseLong(parts[0].trim());
                        Integer score = Integer.parseInt(parts[1].trim());
                        scoreMap.put(qId, score);
                    } catch (NumberFormatException e) {
                        // 忽略解析错误
                    }
                }
            }
        }
        return scoreMap;
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