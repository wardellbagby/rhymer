import {
  PlatformDelegate,
  RendererDelegate,
} from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { MobileLogger } from '@mobile-app/platform/Logger';

const logger: Logger = new MobileLogger();

class MobilePlatformDelegate implements PlatformDelegate {
  public send(channel: string, ...args: any[]) {
    logger.info('Sending data to platform', { channel, args });
    queue(rendererListeners.getListeners(channel), args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    logger.info('Registering renderer listener', { channel });
    platformListeners.addListener(channel, listener);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing renderer listener', { channel });
    platformListeners.removeListener(channel, listener);
    return this;
  }
}

export class MobileRendererDelegate implements RendererDelegate {
  public send(channel: string, ...args: any[]) {
    logger.info('Sending data to renderer', { channel, args });
    queue(platformListeners.getListeners(channel), args);
  }

  public on(channel: string, listener: (...args: any[]) => void): this {
    logger.info('Registering platform listener', { channel });
    rendererListeners.addListener(channel, listener);
    return this;
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): this {
    logger.info('Removing platform listener', { channel });
    rendererListeners.removeListener(channel, listener);
    return this;
  }
}

class ListenerManager {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  public addListener(
    channel: string,
    listener: (...args: any[]) => void
  ): void {
    const registeredListeners = this.getListeners(channel);
    registeredListeners.push(listener);

    this.listeners.set(channel, registeredListeners);
  }

  public removeListener(
    channel: string,
    listener: (...args: any[]) => void
  ): void {
    const registeredListeners = this.getListeners(channel);
    registeredListeners.splice(registeredListeners.indexOf(listener));

    this.listeners.set(channel, registeredListeners);
  }

  public getListeners(channel: string): Array<(...args: any[]) => void> {
    return [...(this.listeners.get(channel) ?? [])];
  }
}

const queue = (functions: Array<(..._: any[]) => void>, args: any[]) => {
  args.forEach((arg) => {
    if (isError(arg)) {
      logger.error(arg.message, arg);
    }
  });

  functions.forEach((listener) => listener(...args));
};

const isError = (e: any) => e instanceof Error;

const platformListeners: ListenerManager = new ListenerManager();
const rendererListeners: ListenerManager = new ListenerManager();

export const platformDelegate: PlatformDelegate = new MobilePlatformDelegate();
export const rendererDelegate: RendererDelegate = new MobileRendererDelegate();
