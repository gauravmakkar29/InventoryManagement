package com.ims.automation.listeners;

import com.ims.services.NovusLoggerService;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

public class ImsTestListener implements ITestListener {

    private static final NovusLoggerService log = NovusLoggerService.init(ImsTestListener.class);

    @Override
    public void onStart(ITestContext context) {
        log.info("========== IMS Gen2 Test Suite Started: {} ==========", context.getName());
    }

    @Override
    public void onFinish(ITestContext context) {
        log.info("========== IMS Gen2 Test Suite Finished: {} ==========", context.getName());
        log.info("Passed: {} | Failed: {} | Skipped: {}",
                context.getPassedTests().size(),
                context.getFailedTests().size(),
                context.getSkippedTests().size());
    }

    @Override
    public void onTestStart(ITestResult result) {
        log.info("[TEST START] {}.{}", result.getTestClass().getName(), result.getMethod().getMethodName());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        log.info("[TEST PASSED] {}.{} - Duration: {}ms",
                result.getTestClass().getName(),
                result.getMethod().getMethodName(),
                result.getEndMillis() - result.getStartMillis());
    }

    @Override
    public void onTestFailure(ITestResult result) {
        log.error("[TEST FAILED] {}.{} - {}",
                result.getTestClass().getName(),
                result.getMethod().getMethodName(),
                result.getThrowable().getMessage());
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        log.warning("[TEST SKIPPED] {}.{}", result.getTestClass().getName(), result.getMethod().getMethodName());
    }

    @Override
    public void onTestFailedButWithinSuccessPercentage(ITestResult result) {
        log.warning("[TEST PARTIAL] {}.{}", result.getTestClass().getName(), result.getMethod().getMethodName());
    }
}
