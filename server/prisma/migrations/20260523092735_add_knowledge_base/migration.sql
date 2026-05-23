-- AlterTable
ALTER TABLE "narrative_templates" ADD COLUMN     "hook_questions" TEXT[];

-- CreateTable
CREATE TABLE "spot_facts" (
    "id" TEXT NOT NULL,
    "spot_id" TEXT NOT NULL,
    "fact_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "spot_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spot_connections" (
    "id" TEXT NOT NULL,
    "from_spot_id" TEXT NOT NULL,
    "to_spot_id" TEXT NOT NULL,
    "hook_fact" TEXT NOT NULL,
    "payoff_text" TEXT NOT NULL,

    CONSTRAINT "spot_connections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "spot_facts" ADD CONSTRAINT "spot_facts_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_connections" ADD CONSTRAINT "spot_connections_from_spot_id_fkey" FOREIGN KEY ("from_spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spot_connections" ADD CONSTRAINT "spot_connections_to_spot_id_fkey" FOREIGN KEY ("to_spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
