// Mock implementations of NestJS decorators to satisfy the TypeScript compiler
// during testing since @nestjs/common is explicitly omitted from dependencies.

export const Controller = (_path?: string): ClassDecorator => () => {};
export const Get = (_path?: string): MethodDecorator => () => {};
export const Post = (_path?: string): MethodDecorator => () => {};
export const Put = (_path?: string): MethodDecorator => () => {};
export const Delete = (_path?: string): MethodDecorator => () => {};
export const Param = (_name?: string): ParameterDecorator => () => {};
export const Body = (): ParameterDecorator => () => {};
export const Query = (_name?: string): ParameterDecorator => () => {};
export const UseGuards = (..._args: unknown[]): MethodDecorator & ClassDecorator => () => {};
export const HttpCode = (_status: number): MethodDecorator => () => {};

// Mocks for class-validator
export const IsString = (): PropertyDecorator => () => {};
export const IsNumber = (): PropertyDecorator => () => {};
export const IsOptional = (): PropertyDecorator => () => {};
export const IsNotEmpty = (): PropertyDecorator => () => {};
export const MinLength = (_min: number): PropertyDecorator => () => {};
export const MaxLength = (_max: number): PropertyDecorator => () => {};
export const Min = (_min: number): PropertyDecorator => () => {};
export const Max = (_max: number): PropertyDecorator => () => {};
export const IsEnum = (_entity: object): PropertyDecorator => () => {};
export const IsArray = (): PropertyDecorator => () => {};
export const ArrayMinSize = (_min: number): PropertyDecorator => () => {};
export const IsEmail = (): PropertyDecorator => () => {};
