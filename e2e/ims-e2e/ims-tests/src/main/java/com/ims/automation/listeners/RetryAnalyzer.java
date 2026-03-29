package com.ims.automation.listeners;

import com.ims.services.NovusLoggerService;
import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * TestNG retry analyzer — retries failed tests once to detect flaky failures.
 * If a test passes on retry, it was flaky (not a genuine bug).
 * If it fails again on retry, it's a genuine failure.
 */
public class RetryAnalyzer implements IRetryAnalyzer {

    private static final int MAX_RETRY_COUNT = 1;
    private int retryCount = 0;
    private static final NovusLoggerService log = NovusLoggerService.init(RetryAnalyzer.class);

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            log.warning("[RETRY #{}/{}] Retrying failed test: {}.{} — checking for flaky behavior",
                    retryCount, MAX_RETRY_COUNT,
                    result.getTestClass().getName(),
                    result.getMethod().getMethodName());
            return true;
        }
        return false;
    }
}
