-- CreateTable
CREATE TABLE "AppSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "emailOnOtSubmit" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);
