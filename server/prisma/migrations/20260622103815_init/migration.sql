-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "posX" REAL,
    "posY" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT,
    "jobTitle" TEXT,
    "email" TEXT,
    "linkedInUrl" TEXT,
    "companyId" TEXT,
    "companyName" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    CONSTRAINT "Node_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'other',
    "howMet" TEXT,
    "whereMet" TEXT,
    "whyTalked" TEXT,
    "dateOfInteraction" DATETIME,
    "strength" INTEGER NOT NULL DEFAULT 3,
    "followUpNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Edge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Edge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Edge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Node_userId_idx" ON "Node"("userId");

-- CreateIndex
CREATE INDEX "Edge_userId_idx" ON "Edge"("userId");

-- CreateIndex
CREATE INDEX "Edge_sourceId_idx" ON "Edge"("sourceId");

-- CreateIndex
CREATE INDEX "Edge_targetId_idx" ON "Edge"("targetId");
