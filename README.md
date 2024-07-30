# Who Did What

Function app code

## Getting started

Set environment variables:

- `SAS_TOKEN` - the SAS token (look in our team slack channel for this)

Compile typescript to javascript and watch changes:
`npm run watch`

To run the functions locally:
`npx func start`

## Deploy

Run
`npx func azure functionapp publish whodidwhat`

## Problem statement

Who Did What - Slackbot

**Ideal situation**
Developers should be notified of any changes to code they are interested in or are experts on to prevent inconsistencies and bugs across codebases.

**Problem**
Currently, numerous teams and developers are working on the same codebases, resulting in frequent changes. This makes it challenging for teams and developers to track specific file or folder changes on a granular level. Subject matter experts, in particular, need to stay informed about relevant changes.

**Example Scenarios**

**_Example 1_**
As a DevOps engineer, we have a shared .yaml configuration file for our cloud infrastructure deployments. If a team member changes this file, it could impact the infrastructure and be relevant for other teams. Therefore, we need to be aware of such changes to manage them centrally.

**_Example 2:_**
As a test engineer, we maintain a comprehensive set of tests to ensure new code is properly tested and bug-free. If a team member modifies or removes a test to make their changes pass, we need to be informed about this change.

**Solution**
We developed a Slack bot that allows users to subscribe to specific git repositories and specify folder or file patterns. This bot alerts them when code in the designated areas is changed in a git repository pull request.
