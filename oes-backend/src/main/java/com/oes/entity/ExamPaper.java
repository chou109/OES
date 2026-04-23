package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_paper")
public class ExamPaper extends BaseEntity {
    private String title;
    private Long subjectId;
    private Integer totalScore;
    private Integer passScore;
    private Integer duration;
    private Integer questionCount;
    private Long creatorId;
    private String questionIds;
    private String questionOrder;
    private String config;
    private String status;
}
