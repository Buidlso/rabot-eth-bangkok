import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1731675452009 implements MigrationInterface {
    name = 'Init1731675452009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "type" text NOT NULL, "description" text, "logo" text, "network" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8b1b0180229dec2cbfdf5e776e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_bots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bot_type" text NOT NULL, "bot_wallet_id" text NOT NULL, "bot_wallet_address" text NOT NULL, "user_wallet_address" text NOT NULL, "smart_wallet_address" text NOT NULL, "balance" numeric NOT NULL DEFAULT '0', "amount_deposited" numeric NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "bot_id" uuid, CONSTRAINT "PK_a7b98ebbc184291f95f72910e3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "wallet_address" text NOT NULL, "name" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_bots" ADD CONSTRAINT "FK_b37324568a0b501b2216e04ca85" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_bots" ADD CONSTRAINT "FK_24e328f7f398d05310cbd35c5ba" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bots" DROP CONSTRAINT "FK_24e328f7f398d05310cbd35c5ba"`);
        await queryRunner.query(`ALTER TABLE "user_bots" DROP CONSTRAINT "FK_b37324568a0b501b2216e04ca85"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_bots"`);
        await queryRunner.query(`DROP TABLE "bots"`);
    }

}
