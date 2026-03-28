#!/usr/bin/env bash
# =============================================================================
# setup-project-views.sh
#
# GitHub Projects V2 does NOT expose a public API for creating or configuring
# views. The GraphQL mutation "createProjectV2View" does not exist, and there
# is no REST endpoint either. Views must be created manually in the GitHub UI.
#
# This script:
#   1. Confirms the project description is set correctly (via API).
#   2. Opens the project board in the browser so you can create views manually.
#   3. Prints step-by-step instructions for creating each view.
# =============================================================================

set -euo pipefail

GH="${GH_CLI:-gh}"
PROJECT_ID="PVT_kwHOARf1_84BTD7o"
OWNER="gauravmakkar29"
PROJECT_NUMBER=1

# --- Field IDs (for reference when configuring filters) ---
STATUS_FIELD="PVTSSF_lAHOARf1_84BTD7ozhAadYA"
STORY_POINTS_FIELD="PVTF_lAHOARf1_84BTD7ozhAadek"
PRIORITY_FIELD="PVTSSF_lAHOARf1_84BTD7ozhAadhM"
QA_STATUS_FIELD="PVTSSF_lAHOARf1_84BTD7ozhAadh8"
MILESTONE_FIELD="PVTF_lAHOARf1_84BTD7ozhAadYM"

# --- Status Option IDs ---
STATUS_BACKLOG="f9fd6173"
STATUS_SPRINT_READY="b8324eb6"
STATUS_IN_DEV="1f601fb5"
STATUS_IN_REVIEW="023b7b99"
STATUS_IN_QA="69b90ffa"
STATUS_DONE="3e23a1ed"
STATUS_BLOCKED="3032bbe4"

echo "============================================================"
echo " IMS Gen2 HLM Platform - Project Board Setup"
echo "============================================================"
echo ""

# Step 1: Update project description
echo "[1/3] Updating project description..."
MSYS_NO_PATHCONV=1 "$GH" api graphql -f query="
mutation {
  updateProjectV2(input: {
    projectId: \"$PROJECT_ID\"
    shortDescription: \"IMS Gen2 Hardware Lifecycle Management — Sprint Board, Backlog, and Roadmap\"
  }) {
    projectV2 { shortDescription }
  }
}" --jq '.data.updateProjectV2.projectV2.shortDescription'
echo "  -> Description updated."
echo ""

# Step 2: Open in browser
echo "[2/3] Opening project in browser..."
"$GH" project view "$PROJECT_NUMBER" --owner "$OWNER" --web 2>/dev/null &
echo "  -> Browser opened."
echo ""

# Step 3: Print manual instructions
echo "[3/3] Manual view creation steps:"
echo ""
cat <<'INSTRUCTIONS'
GitHub Projects V2 views cannot be created via the API. Please create the
following 4 views manually in the GitHub web UI:

----------------------------------------------------------------------
VIEW 1: Sprint Board
----------------------------------------------------------------------
  Layout:  Board
  Filter:  status:"Sprint Ready","In Development","In Review","In QA","Done","Blocked"
           (This excludes Backlog items from the board)
  Columns: The board will auto-group by Status field

  Steps:
    1. Click "+ New view" (tab bar, top of project)
    2. Name it "Sprint Board"
    3. Click the layout dropdown -> select "Board"
    4. Click the filter bar and type:
         status:"Sprint Ready","In Development","In Review","In QA","Done","Blocked"
    5. Click "Save changes"

----------------------------------------------------------------------
VIEW 2: Backlog
----------------------------------------------------------------------
  Layout:  Table
  Filter:  status:Backlog
  Group:   Milestone

  Steps:
    1. Click "+ New view"
    2. Name it "Backlog"
    3. Keep layout as "Table"
    4. In the filter bar, type:  status:Backlog
    5. Click the down-arrow next to the view name -> "Group by" -> select "Milestone"
    6. Click "Save changes"

----------------------------------------------------------------------
VIEW 3: Bugs
----------------------------------------------------------------------
  Layout:  Table
  Filter:  label:bug
  Columns: Title, Status, Priority, QA Status, Assignees

  Steps:
    1. Click "+ New view"
    2. Name it "Bugs"
    3. Keep layout as "Table"
    4. In the filter bar, type:  label:bug
    5. Add columns: click "+" in the header row to add Priority, QA Status
    6. Click "Save changes"

----------------------------------------------------------------------
VIEW 4: Roadmap
----------------------------------------------------------------------
  Layout:  Roadmap
  Group:   Milestone

  Steps:
    1. Click "+ New view"
    2. Name it "Roadmap"
    3. Click the layout dropdown -> select "Roadmap"
    4. Click the down-arrow next to the view name -> "Group by" -> select "Milestone"
    5. Click "Save changes"

----------------------------------------------------------------------

TIP: You can also rename the existing default "View 1" to "Sprint Board"
     instead of creating a new view, then change its layout to Board.

INSTRUCTIONS

echo ""
echo "============================================================"
echo " Done. Project description updated. Create views manually."
echo "============================================================"
