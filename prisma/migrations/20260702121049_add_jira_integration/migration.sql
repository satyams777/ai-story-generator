-- AlterTable
ALTER TABLE "Project" ADD COLUMN "jiraIssueTypeId" TEXT;
ALTER TABLE "Project" ADD COLUMN "jiraIssueTypeName" TEXT;
ALTER TABLE "Project" ADD COLUMN "jiraProjectKey" TEXT;

-- CreateTable
CREATE TABLE "JiraConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JiraConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JiraConnection_userId_key" ON "JiraConnection"("userId");
