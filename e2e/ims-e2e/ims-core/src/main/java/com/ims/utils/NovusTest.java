package com.ims.utils;

import lombok.Data;

@Data
public class NovusTest {
    private String author;
    private String scenario;
    private String outcome;
    private String status;
    private String testCaseId;
    private String category;
    private String failureMessage;
    private boolean potentialBug;
    private String bugs;
}
