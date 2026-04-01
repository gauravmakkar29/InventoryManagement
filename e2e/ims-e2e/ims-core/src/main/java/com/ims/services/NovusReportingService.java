package com.ims.services;

import com.aventstack.extentreports.AnalysisStrategy;
import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.markuputils.ExtentColor;
import com.aventstack.extentreports.markuputils.MarkupHelper;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import com.ims.annotations.Description;
import com.ims.annotations.MetaData;
import com.ims.annotations.Outcome;
import com.ims.exceptions.NovusConfigException;
import com.ims.utils.NovusExtentCodeBlock;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.testng.ITestResult;
import org.testng.annotations.Test;
import org.testng.internal.Utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

import static com.aventstack.extentreports.MediaEntityBuilder.createScreenCaptureFromBase64String;
import static com.ims.utils.DateTimeUtility.MMDDYY__WITH_DASHES;
import static java.time.LocalDate.now;
import static org.slf4j.helpers.MessageFormatter.arrayFormat;

@Service
public class NovusReportingService {

    ThreadLocal<ExtentTest> test = new ThreadLocal<>();
    ExtentReports report;
    ThreadLocal<ExtentTest> testSteps = new ThreadLocal<>();
    @Value("${emailable.report.enabled}")
    private boolean reportingEnabled;
    @Value("${emailable.report.name}")
    private String reportName;

    public void init(String reportName) {
        if (reportingEnabled) {
            report = new ExtentReports();
            var reportPath = System.getProperty("user.dir") + String.format("/src/test/resources/reports/%1$s/%2$s/%2$s.html", now().format(MMDDYY__WITH_DASHES), reportName);
            try {
                Files.createDirectories(Paths.get(reportPath).getParent());
            } catch (IOException e) {
                throw new NovusConfigException("Failed to create report directory", e);
            }
            var spark = new ExtentSparkReporter(reportPath);
            spark.config().setTheme(Theme.DARK);
            spark.config().setDocumentTitle("Novus Automation Report");
            spark.config().setReportName(reportName);
            spark.config().setOfflineMode(true);
            spark.config().thumbnailForBase64(true);
            spark.config().setCss(
                """
                    .accordion>.card>.card-header>.card-title>a {
                    	padding: 15px 25px;
                    	display: block;
                    	color: #ffcc00
                    }
                    """);
            report.attachReporter(spark);
            report.setAnalysisStrategy(AnalysisStrategy.CLASS);
        }
    }

    public void saveReport() {
        if (reportingEnabled)
            report.flush();
    }

    public synchronized void addTest(Method testInfo) {
        if (reportingEnabled) {
            var desc = testInfo.getAnnotation(Description.class);
            var testAnnotation = testInfo.getAnnotation(Test.class);
            String testName = desc != null ? desc.value()
                    : (testAnnotation != null && !testAnnotation.description().isEmpty()) ? testAnnotation.description()
                    : testInfo.getName();
            test.set(report.createTest(testInfo.getDeclaringClass().getSimpleName() + " - " + testName));
            addScenario(testInfo);
            testSteps.set(test.get().createNode("Test Case Execution Steps"));
            addTestMetadata(testInfo);
        }
    }

    public synchronized void addScenario(Method testInfo) {
        if (reportingEnabled) {
            var desc = testInfo.getAnnotation(Description.class);
            var outcome = testInfo.getAnnotation(Outcome.class);
            var testAnnotation = testInfo.getAnnotation(Test.class);
            String descText = desc != null ? desc.value()
                    : (testAnnotation != null && !testAnnotation.description().isEmpty()) ? testAnnotation.description()
                    : "No description";
            String outcomeText = outcome != null ? outcome.value() : "Verify test passes";

            ExtentTest testDetails = test.get().createNode("Test Case Details");
            String[][] details = {
                {"Test Description", "Expected Outcome"},
                {descText, outcomeText}};
            testDetails.info(MarkupHelper.createTable(details));
            var meta = testInfo.getAnnotation(MetaData.class);
            if (meta != null) {
                var isExpected = meta.bugs().length != 0 || (testAnnotation != null && testAnnotation.expectedExceptions().length != 0);
                String[][] metaData = {
                    {"References", "Bugs"},
                    {Arrays.toString(meta.stories()), Arrays.toString(meta.bugs())}};
                ExtentTest testMeta = test.get().createNode("Test Case Meta Data");
                testMeta.info(MarkupHelper.createTable(metaData));
                if (isExpected) test.get().warning(MarkupHelper.createLabel("This Test Case is Expected to FAIL", ExtentColor.RED));
            }
        }
    }


    public synchronized void attachResult() {
        if (reportingEnabled) {
            var testStatus = Status.SKIP;
            var labelColor = ExtentColor.YELLOW;
            testSteps.get().log(testStatus, MarkupHelper.createLabel("Test finished with result: " + testStatus, labelColor));
        }
    }

    public synchronized void attachResult(ITestResult result) {
        if (reportingEnabled) {
            if (testSteps == null || testSteps.get() == null) {
                return;
            }
            Status testStatus = result.getStatus() == ITestResult.SUCCESS ? Status.PASS : Status.SKIP;
            ExtentColor labelColor = result.getStatus() == ITestResult.SUCCESS ? ExtentColor.GREEN : ExtentColor.YELLOW;
            testSteps.get().log(testStatus, MarkupHelper.createLabel("Test finished with result: " + testStatus, labelColor));
        }
    }

    public synchronized void attachResult(ITestResult result, String path) {
        if (reportingEnabled) {
            if (testSteps == null) {
                return;
            }
            Status testStatus;
            ExtentColor labelColor;
            if (result.getStatus() == ITestResult.FAILURE) {
                testStatus = Status.FAIL;
                labelColor = ExtentColor.RED;
                if (path != null) {
                    testSteps.get().fail(createScreenCaptureFromBase64String(base64(path), "Screenshot").build());
                }
            } else if (result.getStatus() == ITestResult.SUCCESS) {
                testStatus = Status.PASS;
                labelColor = ExtentColor.GREEN;
            } else {
                testStatus = Status.SKIP;
                labelColor = ExtentColor.YELLOW;
            }
            testSteps.get().log(testStatus, MarkupHelper.createLabel("Test finished with result: " + testStatus, labelColor));
            if (result.getThrowable() != null) {
                testSteps.get().log(testStatus, logWithLabel("Exception : ", labelColor, result.getThrowable().getMessage()));
                testSteps.get().log(testStatus, NovusExtentCodeBlock.withCode(result.getThrowable().getMessage()).withTitle("Exception Message", labelColor));
                testSteps.get().log(testStatus, NovusExtentCodeBlock.withCode(StringUtils.join(Utils.shortStackTrace(result.getThrowable(), true), "\n")).withTitle("Stack Trace", labelColor));
            }
            testSteps.get().info("Test Report Complete");
        }
    }

    private synchronized String logWithLabel(String label, ExtentColor labelColor, String logText) {
        return MarkupHelper.createLabel(label, labelColor).getMarkup() + " " + logText;
    }

    public synchronized void addStep(String step, Object... vars) {
        if (reportingEnabled) {
            if (testSteps.get() == null) {
                return;
            }
            testSteps.get().info(logWithLabel(" Step ", ExtentColor.BLUE, arrayFormat(step, vars).getMessage()));
        }
    }

    public synchronized void pass(String verify) {
        if (testSteps.get() == null) {
            return;
        }
        testSteps.get().pass(logWithLabel(" Verify ", ExtentColor.GREEN, verify));
    }

    public synchronized void fail(String verify) {
        if (testSteps.get() == null) {
            return;
        }
        testSteps.get().fail(logWithLabel(" Verify ", ExtentColor.RED, verify));
    }

    private synchronized void addTestMetadata(Method method) {
        var metaData = method.getAnnotation(MetaData.class);
        if (metaData != null) {
            test.get().assignAuthor(metaData.author());
            test.get().assignCategory(metaData.category());
        }
    }

    private String base64(String path) {
        File f = new File(path);
        try (FileInputStream fis = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            fis.read(b);
            return new String(Base64.encodeBase64(b), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new NovusConfigException(e);
        }
    }
}
