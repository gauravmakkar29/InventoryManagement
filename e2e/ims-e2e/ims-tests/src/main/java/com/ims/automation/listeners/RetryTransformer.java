package com.ims.automation.listeners;

import org.testng.IAnnotationTransformer;
import org.testng.annotations.ITestAnnotation;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * Automatically applies RetryAnalyzer to all test methods.
 * Add to suite XML: <listener class-name="com.ims.automation.listeners.RetryTransformer"/>
 */
public class RetryTransformer implements IAnnotationTransformer {

    @Override
    public void transform(ITestAnnotation annotation, Class testClass, Constructor testConstructor, Method testMethod) {
        if (annotation.getRetryAnalyzerClass() == null || annotation.getRetryAnalyzerClass().equals(Object.class)) {
            annotation.setRetryAnalyzer(RetryAnalyzer.class);
        }
    }
}
