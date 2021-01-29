import { PlatformDelegate } from '@common/Delegates';
import { RendererLogger } from "@common/globals";

const [APP_VERSION, APP_HOMEPAGE, APP_AUTHOR] = [
  process.env.APP_VERSION,
  process.env.APP_HOMEPAGE,
  process.env.APP_AUTHOR,
];

const logger: RendererLogger = window.logger;
const platformDelegate: PlatformDelegate = window.platformDelegate;

export { APP_AUTHOR, APP_HOMEPAGE, APP_VERSION, logger, platformDelegate };