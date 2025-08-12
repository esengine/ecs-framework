/**
 * reflect-metadata 类型扩展
 */

/// <reference types="reflect-metadata" />

declare namespace Reflect {
  function defineMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol): void;
  function getMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): any;
  function getOwnMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): any;
  function hasMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): boolean;
  function hasOwnMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): boolean;
  function deleteMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): boolean;
  function getMetadataKeys(target: any, propertyKey?: string | symbol): any[];
  function getOwnMetadataKeys(target: any, propertyKey?: string | symbol): any[];
}