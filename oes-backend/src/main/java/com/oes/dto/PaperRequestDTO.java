package com.oes.dto;

import com.oes.entity.ExamPaper;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class PaperRequestDTO {
    private ExamPaper paper;
    private List<Long> questionIds;
    private List<Map<String, Object>> questionScores;
}
