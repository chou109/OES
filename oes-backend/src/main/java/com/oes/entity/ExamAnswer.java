package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_answer")
public class ExamAnswer extends BaseEntity {
    private Long recordId;
    private Long questionId;
    private Long studentId;
    private String answer;
    private Integer isCorrect;
    private Integer score;
    private Integer autoScore;
    private Integer manualScore;
}
