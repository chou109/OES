package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamPaper;
import com.oes.entity.ExamQuestion;
import com.oes.entity.ExamSubject;
import com.oes.mapper.ExamPaperMapper;
import com.oes.mapper.ExamQuestionMapper;
import com.oes.mapper.ExamSubjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ExamQuestionService extends ServiceImpl<ExamQuestionMapper, ExamQuestion> {
    
    private final ExamPaperMapper paperMapper;
    
    public ExamQuestionService(ExamPaperMapper paperMapper) {
        this.paperMapper = paperMapper;
    }

    public PageResult<ExamQuestion> page(Integer current, Integer size, Long subjectId, String type,
                                         String difficulty, String keyword) {
        Page<ExamQuestion> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamQuestion> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamQuestion::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(ExamQuestion::getType, type);
        }
        if (StringUtils.hasText(difficulty)) {
            wrapper.eq(ExamQuestion::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ExamQuestion::getContent, keyword);
        }
        wrapper.orderByDesc(ExamQuestion::getCreateTime);
        IPage<ExamQuestion> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public List<ExamQuestion> listByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return list(new LambdaQueryWrapper<ExamQuestion>()
                .in(ExamQuestion::getId, ids));
    }

    public List<ExamQuestion> randomQuestions(Long subjectId, String type, String difficulty,
                                               Integer count, String knowledgePointIds) {
        LambdaQueryWrapper<ExamQuestion> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamQuestion::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(type)) {
            wrapper.eq(ExamQuestion::getType, type);
        }
        if (StringUtils.hasText(difficulty)) {
            wrapper.eq(ExamQuestion::getDifficulty, difficulty);
        }
        if (StringUtils.hasText(knowledgePointIds)) {
            wrapper.apply("FIND_IN_SET(knowledge_point_ids, {0})",
                    Arrays.stream(knowledgePointIds.split(","))
                            .map(String::trim)
                            .collect(Collectors.joining(",")));
        }
        // 使用 last 方法实现随机排序
        wrapper.last("ORDER BY RAND()");
        if (count == null || count <= 0) {
            count = 100;
        }
        return page(new Page<>(1, count), wrapper).getRecords();
    }

    public void incrementUsedCount(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question != null) {
            question.setUsedCount(question.getUsedCount() + 1);
            updateById(question);
        }
    }

    public void incrementCorrectCount(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question != null) {
            question.setCorrectCount(question.getCorrectCount() + 1);
            updateById(question);
        }
    }

    public Double getCorrectRate(Long questionId) {
        ExamQuestion question = getById(questionId);
        if (question == null || question.getUsedCount() == 0) {
            return 0.0;
        }
        return (double) question.getCorrectCount() / question.getUsedCount();
    }

    /**
     * 从文本中批量导入题目
     */
    public Map<String, Object> importFromText(String text, Long subjectId, Long creatorId) {
        List<ExamQuestion> questions = parseTextToQuestions(text, subjectId, creatorId);
        Map<String, Object> result = new HashMap<>();
        
        if (questions.isEmpty()) {
            result.put("success", false);
            result.put("message", "未识别到有效题目");
            result.put("imported", 0);
            return result;
        }

        int successCount = 0;
        int failCount = 0;
        List<String> errors = new ArrayList<>();

        for (ExamQuestion question : questions) {
            try {
                if (save(question)) {
                    successCount++;
                } else {
                    failCount++;
                    errors.add("题目导入失败: " + truncateContent(question.getContent(), 30));
                }
            } catch (Exception e) {
                failCount++;
                errors.add("题目导入异常: " + truncateContent(question.getContent(), 30) + " - " + e.getMessage());
            }
        }

        result.put("success", failCount == 0);
        result.put("message", String.format("导入完成，成功: %d，失败: %d", successCount, failCount));
        result.put("imported", successCount);
        result.put("failed", failCount);
        result.put("errors", errors);
        return result;
    }

    /**
     * 解析文本为题目列表
     */
    private List<ExamQuestion> parseTextToQuestions(String text, Long subjectId, Long creatorId) {
        List<ExamQuestion> questions = new ArrayList<>();
        
        // 分割题目：匹配"1." "2." "一、" "（一）"等格式
        String[] questionBlocks = text.split("(?m)^\\s*([0-9]+[.．、])|([一二三四五六七八九十]+[、])|(（[一二三四五六七八九十]+）)");
        
        for (String block : questionBlocks) {
            block = block.trim();
            if (block.isEmpty()) continue;
            
            ExamQuestion question = parseQuestionBlock(block, subjectId, creatorId);
            if (question != null) {
                questions.add(question);
            }
        }
        
        return questions;
    }

    /**
     * 解析单个题目块
     */
    private ExamQuestion parseQuestionBlock(String block, Long subjectId, Long creatorId) {
        ExamQuestion question = new ExamQuestion();
        question.setSubjectId(subjectId);
        question.setCreatorId(creatorId);
        question.setUsedCount(0);
        question.setCorrectCount(0);
        question.setDifficulty("MEDIUM");
        question.setScore(5);

        // 检测题目类型
        String type = detectQuestionType(block);
        question.setType(type);

        // 提取题目内容和答案
        String content = "";
        String answer = "";
        String options = "";

        if ("JUDGMENT".equals(type)) {
            // 判断题：提取题目内容和答案
            // 先移除（判断）标记
            content = block.replaceAll("[（(]判断[）)]", "").trim();
            
            // 提取答案 - 支持多种格式：（对）、（错）、(对)、(错)、（正确）、（错误）等
            Pattern judgmentAnswerPattern = Pattern.compile("[（(]([对错√×正确错误TtFf是否])[）)]");
            Matcher answerMatcher = judgmentAnswerPattern.matcher(content);
            if (answerMatcher.find()) {
                String answerStr = answerMatcher.group(1);
                // 移除答案标记从内容中
                content = content.replace(answerMatcher.group(0), "").trim();
                // 判断对错
                if (answerStr.matches("[对√正确Tt是].*")) {
                    answer = "A";
                } else {
                    answer = "B";
                }
            }
            
            options = "[{\"key\":\"A\",\"content\":\"正确\"},{\"key\":\"B\",\"content\":\"错误\"}]";
        } else if ("SINGLE_CHOICE".equals(type) || "MULTIPLE_CHOICE".equals(type)) {
            // 选择题：提取题目内容、选项和答案
            List<String> optionList = new ArrayList<>();
            StringBuilder contentBuilder = new StringBuilder();
            
            // 先移除题型标记
            String cleanBlock = block.replaceAll("[（(](单选|多选)[）)]", "").trim();
            
            String[] lines = cleanBlock.split("\n");
            boolean isInOptions = false;
            boolean hasFoundOptions = false;
            
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                
                // 匹配选项格式：A. xxx 或 A、xxx 或 A) xxx 或 A xxx
                if (line.matches("^[AaBbCcDdEeFf][．.、)\\s]\\s*.*")) {
                    isInOptions = true;
                    hasFoundOptions = true;
                    // 提取选项key（第一个字符）
                    String optionKey = line.substring(0, 1).toUpperCase();
                    // 提取选项内容（从分隔符后开始）
                    String optionContent = line.substring(1).trim();
                    // 移除开头的分隔符
                    if (optionContent.startsWith(".") || optionContent.startsWith("、") || 
                        optionContent.startsWith(")") || optionContent.startsWith(" ")) {
                        optionContent = optionContent.substring(1).trim();
                    }
                    optionList.add("{\"key\":\"" + optionKey + "\",\"content\":\"" + escapeJson(optionContent) + "\"}");
                } else if (line.matches("^答案[：:]?\\s*.+")) {
                    // 提取答案行
                    answer = line.replaceAll("^答案[：:]?\\s*", "").toUpperCase().replace("，", ",").trim();
                } else if (isInOptions && hasFoundOptions) {
                    // 选项内容跨行，追加到最后一个选项
                    if (!optionList.isEmpty()) {
                        String lastOption = optionList.remove(optionList.size() - 1);
                        // 解析最后的选项，追加内容
                        int contentStart = lastOption.indexOf("\"content\":\"") + 11;
                        int contentEnd = lastOption.lastIndexOf("\"}");
                        if (contentStart > 10 && contentEnd > contentStart) {
                            String key = lastOption.substring(6, 7);
                            String existingContent = lastOption.substring(contentStart, contentEnd);
                            optionList.add("{\"key\":\"" + key + "\",\"content\":\"" + escapeJson(existingContent + line) + "\"}");
                        } else {
                            optionList.add(lastOption);
                        }
                    }
                } else {
                    // 题目内容
                    if (contentBuilder.length() > 0) contentBuilder.append("\n");
                    contentBuilder.append(line);
                }
            }
            
            content = contentBuilder.toString().trim();
            if (!optionList.isEmpty()) {
                options = "[" + String.join(",", optionList) + "]";
            }
        } else if ("FILL_BLANK".equals(type)) {
            // 填空题：使用正则替换移除答案部分
            content = block.replaceAll("[（(]答案[：:]?[^）)]+[）)]", "_____")
                          .replaceAll("【答案[：:]?[^】]+】", "_____")
                          .replaceAll("___答案___", "_____")
                          .replaceAll("\\$答案[^\\$]+\\$", "_____")
                          .trim();
            
            // 提取答案
            Pattern answerPattern = Pattern.compile("[（(]答案[：:]?([^）)]+)[）)]|【答案[：:]?([^】]+)】|\\$答案([^\\$]+)\\$");
            Matcher matcher = answerPattern.matcher(block);
            StringBuilder answerBuilder = new StringBuilder();
            while (matcher.find()) {
                if (answerBuilder.length() > 0) answerBuilder.append(",");
                String ans = matcher.group(1) != null ? matcher.group(1).trim() : 
                             (matcher.group(2) != null ? matcher.group(2).trim() : matcher.group(3).trim());
                // 清理答案中的空格和换行
                ans = ans.replace("，", ",").replace("\n", "").replace("\r", "");
                answerBuilder.append(ans);
            }
            answer = answerBuilder.toString();
        } else if ("ESSAY".equals(type)) {
            // 简答题
            content = block.replaceAll("[（(]参考答案[：:]?[^）)]+[）)]", "")
                          .replaceAll("【参考答案[^】]+】", "")
                          .trim();
            
            Pattern answerPattern = Pattern.compile("[（(]参考答案[：:]?([^）)]+)[）)]|【参考答案[：:]?([^】]+)】");
            Matcher matcher = answerPattern.matcher(block);
            if (matcher.find()) {
                answer = matcher.group(1) != null ? matcher.group(1).trim() : matcher.group(2).trim();
            }
        }

        if (content.isEmpty()) return null;
        
        question.setContent(content);
        question.setAnswer(answer);
        question.setOptions(options);
        
        return question;
    }

    /**
     * 检测题目类型
     */
    private String detectQuestionType(String block) {
        // 1. 先检查显式标记（优先级最高）
        // 判断题标记
        if (block.contains("（判断）") || block.contains("(判断)") || block.contains("[判断]")) {
            return "JUDGMENT";
        }
        
        // 多选题标记
        if (block.contains("（多选）") || block.contains("(多选)") || block.contains("[多选]")) {
            return "MULTIPLE_CHOICE";
        }
        
        // 单选题标记
        if (block.contains("（单选）") || block.contains("(单选)") || block.contains("[单选]")) {
            return "SINGLE_CHOICE";
        }
        
        // 填空题标记
        if (block.contains("（填空）") || block.contains("(填空)") || block.contains("[填空]")) {
            return "FILL_BLANK";
        }
        
        // 2. 根据内容特征判断
        // 判断题：包含"正确"、"错误"、"对"、"错"等答案标记
        if (block.matches(".*[（(][Tt对√是Ff错×否][）)].*")) {
            return "JUDGMENT";
        }
        
        // 选择题：包含 A. B. C. D. 等选项格式
        if (block.matches(".*[AaBbCcDd][．.、)]\\s*.*")) {
            // 检查是否有多选标记（答案中有多个字母，用逗号分隔）
            Pattern multiAnswerPattern = Pattern.compile("答案[：:]?\\s*([A-Za-z][,，][A-Za-z])");
            if (multiAnswerPattern.matcher(block).find()) {
                return "MULTIPLE_CHOICE";
            }
            return "SINGLE_CHOICE";
        }
        
        // 填空题：包含"___"、"____"、"（答案：）"等格式
        if (block.contains("___") || block.contains("____") || 
            block.contains("（答案：") || block.contains("【答案") ||
            block.contains("$答案")) {
            return "FILL_BLANK";
        }
        
        // 简答题：通常较长，包含"简述"、"试述"、"说明"等关键词
        if (block.contains("简述") || block.contains("试述") || 
            block.contains("说明") || block.contains("分析") ||
            block.contains("论述") || block.contains("参考答案")) {
            return "ESSAY";
        }
        
        // 默认单选题
        return "SINGLE_CHOICE";
    }

    /**
     * JSON转义
     */
    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r");
    }

    /**
     * 截断内容
     */
    private String truncateContent(String content, int maxLength) {
        if (content == null) return "";
        return content.length() > maxLength ? content.substring(0, maxLength) + "..." : content;
    }

    /**
     * 自动组卷
     */
    @Transactional
    public Map<String, Object> autoGeneratePaper(String title, Long subjectId, 
            Map<String, Integer> questionCountMap, Integer totalScore, 
            Integer duration, Integer passScore,
            Long creatorId, String knowledgePointIds) {
        Map<String, Object> result = new HashMap<>();
        
        List<ExamQuestion> selectedQuestions = new ArrayList<>();
        
        for (Map.Entry<String, Integer> entry : questionCountMap.entrySet()) {
            String type = entry.getKey();
            Integer count = entry.getValue();
            
            if (count == null || count <= 0) continue;
            
            List<ExamQuestion> questions = randomQuestions(subjectId, type, null, count, knowledgePointIds);
            if (questions.size() < count) {
                result.put("success", false);
                result.put("message", String.format("%s数量不足，需要%d题，仅找到%d题", 
                        getTypeName(type), count, questions.size()));
                return result;
            }
            selectedQuestions.addAll(questions);
        }
        
        // 计算总分并调整分值
        int totalSelectedScore = selectedQuestions.size() * 5; // 默认每题5分
        double scoreRatio = totalScore != null && totalScore > 0 ? 
                (double) totalScore / totalSelectedScore : 1.0;
        
        for (ExamQuestion q : selectedQuestions) {
            q.setScore((int) Math.round(q.getScore() * scoreRatio));
        }
        
        // 创建试卷
        ExamPaper paper = new ExamPaper();
        paper.setTitle(title);
        paper.setSubjectId(subjectId);
        paper.setCreatorId(creatorId);
        paper.setStatus("DRAFT");
        paper.setDuration(duration != null ? duration : 120);
        paper.setPassScore(passScore != null ? passScore : (int) (totalScore != null ? totalScore * 0.6 : 60));
        
        ObjectMapper mapper = new ObjectMapper();
        try {
            List<Map<String, Object>> paperQuestions = new ArrayList<>();
            int index = 1;
            for (ExamQuestion q : selectedQuestions) {
                Map<String, Object> pq = new HashMap<>();
                pq.put("questionId", q.getId());
                pq.put("type", q.getType());
                pq.put("score", q.getScore());
                pq.put("order", index++);
                paperQuestions.add(pq);
            }
            paper.setQuestionIds(mapper.writeValueAsString(paperQuestions));
            paper.setQuestionCount(paperQuestions.size());
            paper.setTotalScore((int) paperQuestions.stream()
                    .mapToInt(p -> (Integer) p.get("score"))
                    .sum());
        } catch (JsonProcessingException e) {
            result.put("success", false);
            result.put("message", "试卷内容序列化失败");
            return result;
        }
        
        // 保存试卷
        paperMapper.insert(paper);
        
        result.put("success", true);
        result.put("message", "自动组卷成功");
        result.put("paperId", paper.getId());
        result.put("questionCount", selectedQuestions.size());
        result.put("totalScore", paper.getTotalScore());
        
        return result;
    }

    /**
     * 获取题型名称
     */
    private String getTypeName(String type) {
        Map<String, String> typeMap = new HashMap<>();
        typeMap.put("SINGLE_CHOICE", "单选题");
        typeMap.put("MULTIPLE_CHOICE", "多选题");
        typeMap.put("JUDGMENT", "判断题");
        typeMap.put("FILL_BLANK", "填空题");
        typeMap.put("ESSAY", "简答题");
        return typeMap.getOrDefault(type, type);
    }
}