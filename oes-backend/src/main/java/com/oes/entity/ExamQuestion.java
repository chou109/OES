package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_question")
public class ExamQuestion extends BaseEntity {
    private Long subjectId;
    private String type;
    private String content;
    private String options;
    private String answer;
    private String analysis;
    private String difficulty;
    private Integer score;
    private String knowledgePointIds;
    private Long creatorId;
    private Integer usedCount;
    private Integer correctCount;
}
