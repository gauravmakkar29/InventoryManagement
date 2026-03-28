# IMS Gen2 E2E Test Guide

## Architecture Overview

The IMS test module follows a 3-layer pattern:

1. **Page** - Static locator constants (no logic, no instances)
2. **Impl** - Static methods returning `Performable` actions with logging
3. **Macro** - High-level workflows composing multiple Impl actions

## How to Add a New Page Object

### Step 1: Create the Page class (locators only)

```java
package com.ims.automation.pages.mymodule;

import com.ims.locatorstrategy.LocateBy;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class MyModulePage {
    public static final String HEADING = LocateBy.text("My Module");
    public static final String SUBMIT_BUTTON = LocateBy.css("[data-testid='submit']");
    public static final String INPUT_FIELD = LocateBy.css("input[name='myfield']");
}
```

### Step 2: Create the Impl class (actions)

```java
package com.ims.automation.impls.mymodule;

import com.ims.actions.*;
import com.ims.automation.pages.mymodule.MyModulePage;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class MyModuleImpl {

    public static Performable enterField(String value) {
        return Perform.actions(
                Type.text(value).on(MyModulePage.INPUT_FIELD)
        ).log("enterField", "Entering value into my field");
    }

    public static Performable clickSubmit() {
        return Perform.actions(
                Click.on(MyModulePage.SUBMIT_BUTTON)
        ).log("clickSubmit", "Clicking submit button");
    }
}
```

### Step 3: (Optional) Add to Navigate macro

If the module has its own page route, add a navigation method in `Navigate.java`.

## How to Write a Test

```java
package com.ims.automation.mymodule;

import com.ims.NovusGuiTestBase;
import com.ims.actor.Actor;
import com.ims.annotations.MetaData;
import com.ims.automation.constants.TestGroups;
import com.ims.automation.macros.Login;
import com.ims.automation.services.UrlService;
import com.ims.actions.Launch;
import com.ims.actions.Waiting;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Test(groups = {TestGroups.REGRESSION})
public class MyModuleTests extends NovusGuiTestBase {

    @Autowired
    private UrlService urlService;
    private final Actor actor = new Actor();

    @BeforeClass(dependsOnMethods = "baseBeforeClassSetup")
    public void setup() {
        actor.setBrowser(browser);
        actor.attemptsTo(
                Launch.app(urlService.login()),
                Login.withCredentials("admin@ims.com", "password")
        );
    }

    @MetaData(testCaseId = "IMS-MY-001", author = "your-name", category = "my-module")
    @Test(description = "Verify something works")
    public void verifySomethingWorks() {
        step("Do something");
        actor.attemptsTo(MyModuleImpl.clickSubmit());

        step("Verify the result");
        softly.assertTrue(
                actor.is(Waiting.on(MyModulePage.HEADING)),
                "Heading should be visible"
        );
        softly.assertAll();
    }
}
```

## How to Run Specific Suites

### Run smoke tests
```bash
mvn test -pl ims-tests -DsuiteXmlFile=src/test/resources/suites/smoke-suite.xml
```

### Run full regression
```bash
mvn test -pl ims-tests -DsuiteXmlFile=src/test/resources/suites/regression-suite.xml
```

### Run a specific module group
```bash
mvn test -pl ims-tests -DsuiteXmlFile=src/test/resources/suites/module-suite.xml -DtestGroup=inventory
```

### Run with local profile (headed browser)
```bash
mvn test -pl ims-tests -Dspring.profiles.active=local -DsuiteXmlFile=src/test/resources/suites/smoke-suite.xml
```

## Actor / DSL Pattern Examples

### Simple navigation and assertion
```java
actor.attemptsTo(
    Navigate.to().dashboard(),
    DashboardImpl.refreshDashboard()
);
softly.assertTrue(actor.is(Waiting.on(DashboardPage.KPI_CARD)), "KPI cards visible");
```

### Login macro
```java
actor.attemptsTo(
    Launch.app(urlService.login()),
    Login.withCredentials("user@ims.com", "password123")
);
```

### Chaining with conditional clicks
```java
actor.attemptsTo(
    Click.on(SidebarPage.INVENTORY_LINK).ifDisplayed(SidebarPage.SIDEBAR_NAV)
);
```

## Available Locator Strategies

- `LocateBy.css("selector")` - CSS selector
- `LocateBy.id("element-id")` - By ID attribute
- `LocateBy.text("visible text")` - By visible text content
- `LocateBy.dataIdentifier("identifier")` - By data-identifier attribute
- `LocateBy.xpath("//xpath")` - XPath selector
- `LocateBy.name("name")` - By name attribute
- `LocateBy.withCssText("css", "text")` - CSS selector with text filter
- `LocateBy.withExactCssText("css", "text")` - CSS selector with exact text match
