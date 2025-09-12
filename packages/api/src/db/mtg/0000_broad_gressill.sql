-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `meta` (
	`date` numeric,
	`version` text
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`baseSetSize` integer,
	`block` text,
	`cardsphereSetId` integer,
	`code` text(8) NOT NULL,
	`isFoilOnly` numeric,
	`isForeignOnly` numeric,
	`isNonFoilOnly` numeric,
	`isOnlineOnly` numeric,
	`isPartialPreview` numeric,
	`keyruneCode` text,
	`languages` text,
	`mcmId` integer,
	`mcmIdExtras` integer,
	`mcmName` text,
	`mtgoCode` text,
	`name` text,
	`parentCode` text,
	`releaseDate` text,
	`tcgplayerGroupId` integer,
	`tokenSetCode` text,
	`totalSetSize` integer,
	`type` text
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`artist` text,
	`artistIds` text,
	`asciiName` text,
	`attractionLights` text,
	`availability` text,
	`boosterTypes` text,
	`borderColor` text,
	`cardParts` text,
	`colorIdentity` text,
	`colorIndicator` text,
	`colors` text,
	`defense` text,
	`duelDeck` text,
	`edhrecRank` integer,
	`edhrecSaltiness` real,
	`faceConvertedManaCost` real,
	`faceFlavorName` text,
	`faceManaValue` real,
	`faceName` text,
	`finishes` text,
	`flavorName` text,
	`flavorText` text,
	`frameEffects` text,
	`frameVersion` text,
	`hand` text,
	`hasAlternativeDeckLimit` numeric,
	`hasContentWarning` numeric,
	`hasFoil` numeric,
	`hasNonFoil` numeric,
	`isAlternative` numeric,
	`isFullArt` numeric,
	`isFunny` numeric,
	`isGameChanger` numeric,
	`isOnlineOnly` numeric,
	`isOversized` numeric,
	`isPromo` numeric,
	`isRebalanced` numeric,
	`isReprint` numeric,
	`isReserved` numeric,
	`isStarter` numeric,
	`isStorySpotlight` numeric,
	`isTextless` numeric,
	`isTimeshifted` numeric,
	`keywords` text,
	`language` text,
	`layout` text,
	`leadershipSkills` text,
	`life` text,
	`loyalty` text,
	`manaCost` text,
	`manaValue` real,
	`name` text,
	`number` text,
	`originalPrintings` text,
	`originalReleaseDate` text,
	`originalText` text,
	`otherFaceIds` text,
	`power` text,
	`printings` text,
	`promoTypes` text,
	`rarity` text,
	`rebalancedPrintings` text,
	`relatedCards` text,
	`securityStamp` text,
	`setCode` text,
	`side` text,
	`signature` text,
	`sourceProducts` text,
	`subsets` text,
	`subtypes` text,
	`supertypes` text,
	`text` text,
	`toughness` text,
	`type` text,
	`types` text,
	`uuid` text(36) NOT NULL,
	`variations` text,
	`watermark` text
);
--> statement-breakpoint
CREATE INDEX `cards_uuid` ON `cards` (`uuid`);--> statement-breakpoint
CREATE TABLE `tokens` (
	`artist` text,
	`artistIds` text,
	`asciiName` text,
	`availability` text,
	`boosterTypes` text,
	`borderColor` text,
	`colorIdentity` text,
	`colors` text,
	`edhrecSaltiness` real,
	`faceName` text,
	`finishes` text,
	`flavorName` text,
	`flavorText` text,
	`frameEffects` text,
	`frameVersion` text,
	`hasFoil` numeric,
	`hasNonFoil` numeric,
	`isFullArt` numeric,
	`isFunny` numeric,
	`isOversized` numeric,
	`isPromo` numeric,
	`isReprint` numeric,
	`isTextless` numeric,
	`keywords` text,
	`language` text,
	`layout` text,
	`manaCost` text,
	`name` text,
	`number` text,
	`orientation` text,
	`originalText` text,
	`otherFaceIds` text,
	`power` text,
	`promoTypes` text,
	`relatedCards` text,
	`reverseRelated` text,
	`securityStamp` text,
	`setCode` text,
	`side` text,
	`signature` text,
	`subtypes` text,
	`supertypes` text,
	`text` text,
	`toughness` text,
	`type` text,
	`types` text,
	`uuid` text(36) NOT NULL,
	`watermark` text
);
--> statement-breakpoint
CREATE INDEX `tokens_uuid` ON `tokens` (`uuid`);--> statement-breakpoint
CREATE TABLE `cardIdentifiers` (
	`cardKingdomEtchedId` text,
	`cardKingdomFoilId` text,
	`cardKingdomId` text,
	`cardsphereFoilId` text,
	`cardsphereId` text,
	`deckboxId` text,
	`mcmId` text,
	`mcmMetaId` text,
	`mtgArenaId` text,
	`mtgjsonFoilVersionId` text,
	`mtgjsonNonFoilVersionId` text,
	`mtgjsonV4Id` text,
	`mtgoFoilId` text,
	`mtgoId` text,
	`multiverseId` text,
	`scryfallCardBackId` text,
	`scryfallId` text,
	`scryfallIllustrationId` text,
	`scryfallOracleId` text,
	`tcgplayerEtchedProductId` text,
	`tcgplayerProductId` text,
	`uuid` text
);
--> statement-breakpoint
CREATE INDEX `cardIdentifiers_uuid` ON `cardIdentifiers` (`uuid`);--> statement-breakpoint
CREATE TABLE `cardLegalities` (
	`alchemy` text,
	`brawl` text,
	`commander` text,
	`duel` text,
	`future` text,
	`gladiator` text,
	`historic` text,
	`legacy` text,
	`modern` text,
	`oathbreaker` text,
	`oldschool` text,
	`pauper` text,
	`paupercommander` text,
	`penny` text,
	`pioneer` text,
	`predh` text,
	`premodern` text,
	`standard` text,
	`standardbrawl` text,
	`timeless` text,
	`uuid` text,
	`vintage` text
);
--> statement-breakpoint
CREATE INDEX `cardLegalities_uuid` ON `cardLegalities` (`uuid`);--> statement-breakpoint
CREATE TABLE `cardRulings` (
	`date` numeric,
	`text` text,
	`uuid` text(36) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cardRulings_uuid` ON `cardRulings` (`uuid`);--> statement-breakpoint
CREATE TABLE `cardForeignData` (
	`faceName` text,
	`flavorText` text,
	`identifiers` text,
	`language` text,
	`multiverseId` integer,
	`name` text,
	`text` text,
	`type` text,
	`uuid` text
);
--> statement-breakpoint
CREATE INDEX `cardForeignData_uuid` ON `cardForeignData` (`uuid`);--> statement-breakpoint
CREATE TABLE `cardPurchaseUrls` (
	`cardKingdom` text,
	`cardKingdomEtched` text,
	`cardKingdomFoil` text,
	`cardmarket` text,
	`tcgplayer` text,
	`tcgplayerEtched` text,
	`uuid` text
);
--> statement-breakpoint
CREATE INDEX `cardPurchaseUrls_uuid` ON `cardPurchaseUrls` (`uuid`);--> statement-breakpoint
CREATE TABLE `tokenIdentifiers` (
	`cardKingdomEtchedId` text,
	`cardKingdomFoilId` text,
	`cardKingdomId` text,
	`cardsphereFoilId` text,
	`cardsphereId` text,
	`deckboxId` text,
	`mcmId` text,
	`mcmMetaId` text,
	`mtgArenaId` text,
	`mtgjsonFoilVersionId` text,
	`mtgjsonNonFoilVersionId` text,
	`mtgjsonV4Id` text,
	`mtgoFoilId` text,
	`mtgoId` text,
	`multiverseId` text,
	`scryfallCardBackId` text,
	`scryfallId` text,
	`scryfallIllustrationId` text,
	`scryfallOracleId` text,
	`tcgplayerEtchedProductId` text,
	`tcgplayerProductId` text,
	`uuid` text
);
--> statement-breakpoint
CREATE INDEX `tokenIdentifiers_uuid` ON `tokenIdentifiers` (`uuid`);--> statement-breakpoint
CREATE TABLE `setTranslations` (
	`language` text,
	`setCode` text(20),
	`translation` text
);
--> statement-breakpoint
CREATE TABLE `setBoosterContents` (
	`boosterIndex` integer,
	`boosterName` text(255),
	`setCode` text(20),
	`sheetName` text(255),
	`sheetPicks` integer
);
--> statement-breakpoint
CREATE TABLE `setBoosterContentWeights` (
	`boosterIndex` integer,
	`boosterName` text(255),
	`boosterWeight` integer,
	`setCode` text(20)
);
--> statement-breakpoint
CREATE TABLE `setBoosterSheets` (
	`boosterName` text(255),
	`setCode` text(20),
	`sheetHasBalanceColors` numeric,
	`sheetIsFoil` numeric,
	`sheetName` text(255)
);
--> statement-breakpoint
CREATE TABLE `setBoosterSheetCards` (
	`boosterName` text(255),
	`cardUuid` text(36) NOT NULL,
	`cardWeight` integer,
	`setCode` text(20),
	`sheetName` text(255)
);

*/