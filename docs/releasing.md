# Release Process

## Release changes to Staging

_"As a contributor whose pull request has been been approved, I want to deploy my changes to Staging."_

Simple – just merge your pull request!

Any pull request merged to the `main` branch will automatically activate the deployment pipeline that targets the Staging environment.
You can check the status of a Staging deployment by viewing the ["Deploy to Staging" workflow history](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/deploy-staging.yml)

## Release changes to Production

_"As a team member with sufficient access to manage GitHub releases, I want to deploy a set of changes to Production."_

### Scenario 1: All changes deployed to Staging have been successfully QA'd

> [!TIP]
> This is the simplest scenario, and our **preferred way** to deploy changes to Production.

1. Navigate to the repository [Releases page](https://github.com/usdigitalresponse/usdr-gost/releases).
2. Locate the current draft release. This will displayed at the top, along with a "Draft" label.
3. Click the pencil icon for the draft release to edit it.
4. In the "Write" tab for the release notes:
    - Edit the placeholder text under the **Summary** heading to provide a brief description of the release as a benefit to stakeholders. Summaries are encouraged ("bug fixes and dependency updates" is fine), but if you don't want to provide one, be sure to delete the heading and its placeholder text.
    - Optional: check for any uncategorized changes under the **Other changes** heading (this heading will only be present if there are uncategorized changes), and move/copy them to more appropriate category headings.
5. Switch to the "Preview" tab and review the release notes to confirm that the release notes look suitable for publishing.
6. Ensure that the "Set as pre-release" box is checked (it should be preselected), and then click "Publish Release".

At this point, the deployment will start preparing to ship the changes associated with the published release.
Once the changes are ready to ship, administrators will be notified to review the deployment plan created by Terraform and give final approval.
For more information, refer to **What happens when a release is published?**

### Scenario 2: Not all changes on Staging have been successfully QA'd, but we still want to deploy _some_ things to Production

#### Scenario 2.1: Desired changes to deploy are contained in sequential commits directly following the latest release

> [!TIP]
> Use this workflow when there are consecutive commits that should be deployed to Production, up to a certain point.
> That is, if the latest Production deployment/release tag point to commit A, and commits B, C, and D have since been added to `main`,
> this workflow can be used to deploy commits B and C only.
>
> If non-sequential commits to `main` need to be deployed, refer to Scenario 2.2 below.

Example scenario (all commits on `main`):
```
commit-A  <- Deployed to Production, tagged as the latest release
commit-B  <- Successfully QA'd, ready for Production
commit-C  <- Successfully QA'd, ready for Production
commit-D  <- NOT successfully QA'd
```

1. Follow Steps 1-4 in **Scenario 1** to prepare the release notes.
2. While editing the next draft release, select the "Target" dropdown menu, switch to the "Recent commits" tab, and select the final/latest commit in the series that you want to deploy.
3. Edit the release notes to remove documented changes that come after the selected target commit (i.e. remove changes that will not be deployed in this release).
4. Follow the remaining steps in **Scenario 1** to deploy the release.

#### Scenario 2.2: Desired changes to deploy are contained in nonsequential commits

> [!TIP]
> Use this workflow when there are **nonconsecutive** commits that should be deployed to Production.
> That is, if the latest Production deployment/release tag point to commit A, and commits B, C, D, and E have since been added to `main`,
> this workflow can be used to deploy commits B and D only.
>
> If non-sequential commits to `main` need to be deployed, refer to Scenario 2.2 below.

Example scenario (all commits on `main`):
```
commit-A  <- Deployed to Production, tagged as the latest release
commit-B  <- Successfully QA'd, ready for Production
commit-C  <- NOT successfully QA'd
commit-D  <- Successfully QA'd, ready for Production
commit-E  <- NOT successfully QA'd
```

> [!WARNING]
> Check with a repository admin first to ensure that database migrations will not be affected and are compatible with the desired changes.

> [!NOTE]
> This use-case requires working knowledge of `git cherry-pick`.

> [!IMPORTANT]
> - Only commits that exist on `main` may cherry-picked for a release.
> The deployment workflow checks that the contents of the specified release tag satisfy this requirement;
> if the release tag contains any commit that is not also on `main` _or_ was not cherry-picked from a commit on `main`, the workflow execution will fail.
> - Always be sure to provide the `-x` flag when running `git cherry-pick` so that the resulting commit message [includes a reference to the source commit](https://git-scm.com/docs/git-cherry-pick#Documentation/git-cherry-pick.txt--x).

1. Check out a new branch based on the revision currently deployed to Production (i.e. the latest release tag).
2. Cherry-pick the commit(s) onto the new branch from `main` that you want to include in the release.
3. Push your branch that now contains the cherry-picked commits that you want to release.
4. Follow Steps 1-4 in **Scenario 1** to prepare the release notes.
5. While editing the next draft release, select the "Target" dropdown menu and use the "Branches" tab to select the branch that contains the cherry-picked commits that you want to release.
6. Edit the release notes to remove documented changes were not cherry-picked (i.e. remove changes that will not be deployed in this release).
7. Follow the remaining steps in **Scenario 1** to deploy the release.
8. Optional: Delete the release branch (the release commit is now tagged; the branch is no longer needed)
9. Optional: Generate the next draft release.
  Refer to [How do I generate a new draft release?](#how-do-i-generate-a-new-draft-release) for instructions.

> [!TIP]
> You can skip the final step if you want to wait for a new draft release to be created automatically the next time `main` is updated.

### Scenario 3: Retry a failed deployment without making code changes.

1. Use the ["Deploy to Production" workflow history](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/deploy-production.yml) to locate and navigate to the failed workflow run.
2. Click the "Re-run jobs" button. If prompted, select "Re-run all jobs".
3. Wait for the new workflow run to generate a deployment plan and prompt administrators for review and approval.

### Scenario 4: Revert the Production environment to a previous deployment.

> [!WARNING]
> Check with a repository admin first to ensure that database migrations will not be affected!

- Using the GitHub web UI, using a recent deployment workflow:
  1. Use the ["Deploy to Production" workflow history](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/deploy-production.yml) to locate and navigate to the workflow run that you want to re-execute.
  2. Click "Re-run all jobs".
  3. Wait for the new workflow to generate a deployment plan and prompt administrators for review and approval.
- Using the GitHub web UI, as a new workflow run:
  1. Navigate to the ["Deploy to Production" workflow](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/deploy-production.yml).
  2. Click "Run workflow"
  3. Select the "Branch" dropdown menu, switch to the "Tags" tab, and select the release tag that you want to deploy.
  4. Wait for the new workflow to generate a deployment plan and prompt administrators for review and approval.
- Using the GitHub CLI:
  ```cli
  gh workflow run "Deploy to Production" --ref release/1979.33
  ```

## What happens when a release is published?

When a release is published, its configured tag is pushed based on the configured "Target" (usually the `main` branch).
A push to any tag prefixed with `release/` will trigger the "Deploy to Production" workflow to execute for that tag, which performs the following steps:

1. Validates the contents of the release tag to ensure that it only contains commits (and/or cherry-picked commits) from `main`.
2. Builds and publishes deployment artifacts for the release.
3. Generates a deployment plan for the changes associated with the release.
4. Once a deployment plan has been generated and is ready to ship, repository administrators will be notified with a request to review and approve the deployment plan.
5. Once approved, the pipeline execution will proceed with deploying the changes to Production.
6. Following successful deployment, the deployment pipeline will update the release to:
    - Remove its "Pre-release" label
    - Add the "Latest" label
    - Append the date and time of deployment under the "Release History" heading of the release notes.
    - Upload build artifacts as release assets.

## Useful Information

### What is a tag, and how do we use them for releases?

A tag is an alias that (for the purposes of this document) provides an alias that points to a specific commit. There are many different tagging conventions, but for the purposes of our release process, we are specifically talking about tags formatted as `release/<version-number>`, where `<version-number>` is comprised of two delimited elements: the year of the release, and a number that increments for each subsequent release for that year (i.e. `yyyy.N`). For example, `2023.5` would represent the fifth release published in 2023; `2024.16` would represent the 16th release published in 2024, etc.

#### Why not semantic versioning?

Many software projects (especially libraries) follow versioning schemes like [semantic versioning](https://semver.org/) because it standardizes an explicit way of communicating compatibility changes from one version to the next. You probably recognize semantic versions, like `v1.2.3`. However, because the usdsr-gost repository provides multiple services and offers no single, concrete contract (i.e. an API) about which downstream consumers contend with compatibility decisions, a semantic versioning scheme is less relevant and would likely create ambiguilties rather than clarifying them.

### What is a release?

[GitHub releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) are a repository-level feature in GitHub that add documentation ("release notes") and static file assets (a repo snapshot, and optionally platform-specific build outputs) for a specific tag, which generally serves as a version identifier for the release.

GitHub releases can be in either a **draft** or **published** state. When a release is a **draft**, it is still being assembled and not generally visible to the public. Furthermore, drafts do not have to be associated with a tag that exists in the repository. As mentioned elsewhere, we will use automation to do most of the work around creating release drafts and keeping their contents up-to-date, although humans are responsible for applying final edits to release notes and saving the final outcome as a **published** release. The most-recently published release to successfully deploy to Production is automatically marked as "latest" in GitHub.

Ideally, the repository will always have exactly 1 draft release at any moment (provided there are pull requests that have been merged since the last published release), which can be thought of as the "next release". While no release tag will exist for a draft, we can determine what that tag will be at the time the draft is created by looking at the current year and the tag associated with the latest published release. For example, if the latest published release associated with a tag of `release/2023.4` and the current year is still 2023, we know that the tag associated with the next release will be associated with a tag of `release/2023.5`; if the year is 2024, the next release tag will be `release/2024.1`.

#### Release Terminology

- **Draft release:** A release which has been created in GitHub but is not yet available for public viewing. Ideally, exactly one release draft exists as long as there are changes on `main` that have not yet been deployed to Production.
- **Published release:** Any release that is not a draft, i.e. is publicly viewable, and is considered to be a finalized representation of at least one change to Production.
- **Latest release:** A label indicating the last (published) release that has successfully deployed to Production.
- **Pre-release:** A label indicating that a published release has not yet fully and/or successfully deployed to Production.

### Troubleshooting

#### I accidentally published a release that wasn't ready! How do I fix this?

> [!NOTE]
> Pencils have erasers, keyboards have backspace, and accidental releases can be remedied; these things happen 🙂.

It's probably fine, as every release is admin-reviewed before it actually deploys.
Please begin by posting a notice in the [#project-grants-engineering](https://usdigitalresponse.slack.com/archives/C0324KDQSCR) Slack channel as soon as possible so that admins know not to approve the release – we will be grateful for the heads-up!

If this happens, we will likely want to do a few things (which may differ depending on the scenario):
1. If you have not already done so, give notice in Slack.
2. Cancel the in-progress ["Deploy to Production" workflow](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/deploy-production.yml).
3. Delete the release.
    - Using the GitHub web UI:
      1. Go to the [Releases page](https://github.com/usdigitalresponse/usdr-gost/releases)
      2. Find the release that was accidentally published.
      3. Optional: Copy any markdown from the release notes (like the Summary) that you don't want to lose.
      4. Click the trash can icon to delete the release.
    - Using the GitHub CLI:
      ```cli
      gh release delete release/1979.33  # just deletes the release
      gh release delete release/1979.33 --cleanup-tag  # also deletes the tag
      ```
4. Delete the tag that was pushed when the release was published.
    - Using the GitHub web UI:
      1. Go to the [Tags page](https://github.com/usdigitalresponse/usdr-gost/tags)
      2. Find the tag that was created for the (now-deleted) release.
      3. Click the `...` icon for the tag, and select "Delete tag"
    - Using the CLI:
      ```cli
      git tag delete release/1979.33
      git push --delete origin release/1979.33
      ```
5. Check to ensure that no other releases were created after the release was accidentally published.
  If a new release draft was created (likely because a pull request was recently merged), you should
  delete that draft release as well.
6. Recreate the release.
  Refer to [How do I generate a new draft release?](#how-do-i-generate-a-new-draft-release) for instructions.

#### I want to fix a problem with already-published release notes.

Releases can still be edited after they are initially published without causing any problems or initiating a new deployment.
If you want to fix a typo or otherwise update the release notes after publishing, follow these steps:

1. Go to the [Releases page](https://github.com/usdigitalresponse/usdr-gost/releases)
2. Find the release that you want to edit and click the pencil icon.
3. Use the "Write" and "Preview" tabs in the editor interface to make edits and preview the changes.
4. Click "Update release" to save your changes.

> [!IMPORTANT]
> Unless you *really* know what you're doing...
> - Do not toggle the "Set as a pre-release" or "Set as latest release" checkboxes.
> - Do not change the tag associated with the release.
> - Do not change the title of the release.

#### How do I generate a new draft release?

> [!IMPORTANT]
> In most cases, you should avoid using the "Draft a new release" feature in GitHub to manually create a new release.
> Using the "Release Drafter" workflow helps ensure that releases are generated consistently and can be managed easily.

The easiest way to get a new draft release is to simply wait for pull request to merge;
whenever a commit is pushed to `main`, a new draft release will be generated if it does not already exist.

If you want to create the next draft release without waiting, simply run the Release Drafter workflow:
- Using the GitHub web UI:
  1. Navigate to the ["Release Drafter" workflow](https://github.com/usdigitalresponse/usdr-gost/actions/workflows/release-drafter.yml)
  2. Click "Run workflow"
  3. Select the "Branch" dropdown menu and choose the `main` branch
  4. Click the "Run workflow" button located beneath the selected branch.
- Using the GitHub CLI:
  ```cli
  gh workflow run "Release Drafter" --ref main
  ```
