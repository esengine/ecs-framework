export as namespace Long;

// Type definitions for ./src/long.js
// Project: [LIBRARY_URL_HERE] 
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]> 
// Definitions: https://github.com/borisyankov/DefinitelyTyped
declare namespace Long{
	// Long.fromBytes.!0
	type FromBytes0 = Array<number>;
}
declare namespace Long{
	// Long.fromBytesLE.!0
	type FromBytesLE0 = Array<number>;
}
declare namespace Long{
	// Long.fromBytesBE.!0
	type FromBytesBE0 = Array<number>;
}
declare namespace LongPrototype{
	// LongPrototype.toBytes.!ret
	type ToBytesRet = Array<number>;
}
declare namespace LongPrototype{
	// LongPrototype.toBytesLE.!ret
	type ToBytesLERet = Array<number>;
}
declare namespace LongPrototype{
	// LongPrototype.toBytesBE.!ret
	type ToBytesBERet = Array<number>;
}

/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Longs.
 * @exports Long
 * @class A Long class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @constructor
 */
declare interface Long {
		
	/**
	 * 
	 * @param low 
	 * @param high 
	 * @param unsigned? 
	 */
	new (low : number, high : number, unsigned? : boolean | number);
		
	/**
	 * 
	 */
	__isLong__ : boolean;
		
	/**
	 * 
	 */
	eqz : /* LongPrototype.isZero */ any;
		
	/**
	 * 
	 */
	eq : /* LongPrototype.equals */ any;
		
	/**
	 * 
	 */
	neq : /* LongPrototype.notEquals */ any;
		
	/**
	 * 
	 */
	ne : /* LongPrototype.notEquals */ any;
		
	/**
	 * 
	 */
	lt : /* LongPrototype.lessThan */ any;
		
	/**
	 * 
	 */
	lte : /* LongPrototype.lessThanOrEqual */ any;
		
	/**
	 * 
	 */
	le : /* LongPrototype.lessThanOrEqual */ any;
		
	/**
	 * 
	 */
	gt : /* LongPrototype.greaterThan */ any;
		
	/**
	 * 
	 */
	gte : /* LongPrototype.greaterThanOrEqual */ any;
		
	/**
	 * 
	 */
	ge : /* LongPrototype.greaterThanOrEqual */ any;
		
	/**
	 * 
	 */
	comp : /* LongPrototype.compare */ any;
		
	/**
	 * 
	 */
	neg : /* LongPrototype.negate */ any;
		
	/**
	 * 
	 */
	sub : /* LongPrototype.subtract */ any;
		
	/**
	 * 
	 */
	mul : /* LongPrototype.multiply */ any;
		
	/**
	 * 
	 */
	div : /* LongPrototype.divide */ any;
		
	/**
	 * 
	 */
	mod : /* LongPrototype.modulo */ any;
		
	/**
	 * 
	 */
	rem : /* LongPrototype.modulo */ any;
		
	/**
	 * 
	 */
	shl : /* LongPrototype.shiftLeft */ any;
		
	/**
	 * 
	 */
	shr : /* LongPrototype.shiftRight */ any;
		
	/**
	 * 
	 */
	shru : /* LongPrototype.shiftRightUnsigned */ any;
		
	/**
	 * 
	 */
	shr_u : /* LongPrototype.shiftRightUnsigned */ any;
		
	/**
	 * 
	 */
	rotl : /* LongPrototype.rotateLeft */ any;
		
	/**
	 * 
	 */
	rotr : /* LongPrototype.rotateRight */ any;
		
	/**
	 * 
	 */
	toInt : /* LongPrototype.toInt */ any;
		
	/**
	 * 
	 */
	toNumber : /* LongPrototype.toNumber */ any;
		
	/**
	 * 
	 */
	getHighBits : /* LongPrototype.getHighBits */ any;
		
	/**
	 * 
	 */
	getHighBitsUnsigned : /* LongPrototype.getHighBitsUnsigned */ any;
		
	/**
	 * 
	 */
	getLowBits : /* LongPrototype.getLowBits */ any;
		
	/**
	 * 
	 */
	getLowBitsUnsigned : /* LongPrototype.getLowBitsUnsigned */ any;
		
	/**
	 * 
	 */
	getNumBitsAbs : /* LongPrototype.getNumBitsAbs */ any;
		
	/**
	 * 
	 */
	isZero : /* LongPrototype.isZero */ any;
		
	/**
	 * 
	 */
	isNegative : /* LongPrototype.isNegative */ any;
		
	/**
	 * 
	 */
	isPositive : /* LongPrototype.isPositive */ any;
		
	/**
	 * 
	 */
	isOdd : /* LongPrototype.isOdd */ any;
		
	/**
	 * 
	 */
	isEven : /* LongPrototype.isEven */ any;
		
	/**
	 * 
	 */
	equals : /* LongPrototype.equals */ any;
		
	/**
	 * 
	 */
	notEquals : /* LongPrototype.notEquals */ any;
		
	/**
	 * 
	 */
	lessThan : /* LongPrototype.lessThan */ any;
		
	/**
	 * 
	 */
	lessThanOrEqual : /* LongPrototype.lessThanOrEqual */ any;
		
	/**
	 * 
	 */
	greaterThan : /* LongPrototype.greaterThan */ any;
		
	/**
	 * 
	 */
	greaterThanOrEqual : /* LongPrototype.greaterThanOrEqual */ any;
		
	/**
	 * 
	 */
	compare : /* LongPrototype.compare */ any;
		
	/**
	 * 
	 */
	negate : /* LongPrototype.negate */ any;
		
	/**
	 * 
	 */
	add : /* LongPrototype.add */ any;
		
	/**
	 * 
	 */
	subtract : /* LongPrototype.subtract */ any;
		
	/**
	 * 
	 */
	multiply : /* LongPrototype.multiply */ any;
		
	/**
	 * 
	 */
	divide : /* LongPrototype.divide */ any;
		
	/**
	 * 
	 */
	modulo : /* LongPrototype.modulo */ any;
		
	/**
	 * 
	 */
	not : /* LongPrototype.not */ any;
		
	/**
	 * 
	 */
	and : /* LongPrototype.and */ any;
		
	/**
	 * 
	 */
	or : /* LongPrototype.or */ any;
		
	/**
	 * 
	 */
	xor : /* LongPrototype.xor */ any;
		
	/**
	 * 
	 */
	shiftLeft : /* LongPrototype.shiftLeft */ any;
		
	/**
	 * 
	 */
	shiftRight : /* LongPrototype.shiftRight */ any;
		
	/**
	 * 
	 */
	shiftRightUnsigned : /* LongPrototype.shiftRightUnsigned */ any;
		
	/**
	 * 
	 */
	rotateLeft : /* LongPrototype.rotateLeft */ any;
		
	/**
	 * 
	 */
	rotateRight : /* LongPrototype.rotateRight */ any;
		
	/**
	 * 
	 */
	toSigned : /* LongPrototype.toSigned */ any;
		
	/**
	 * 
	 */
	toUnsigned : /* LongPrototype.toUnsigned */ any;
		
	/**
	 * 
	 */
	toBytes : /* LongPrototype.toBytes */ any;
		
	/**
	 * 
	 */
	toBytesLE : /* LongPrototype.toBytesLE */ any;
		
	/**
	 * 
	 */
	toBytesBE : /* LongPrototype.toBytesBE */ any;
		
	/**
	 * Creates a Long from its byte representation.
	 * @param {!Array.<number>} bytes Byte representation
	 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
	 * @param {boolean=} le Whether little or big endian, defaults to big endian
	 * @returns {Long} The corresponding Long value
	 * @param bytes 
	 * @param unsigned? 
	 * @param le? 
	 * @return  
	 */
	fromBytes(bytes : Long.FromBytes0, unsigned? : boolean, le? : boolean): Long;
		
	/**
	 * Creates a Long from its little endian byte representation.
	 * @param {!Array.<number>} bytes Little endian byte representation
	 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
	 * @returns {Long} The corresponding Long value
	 * @param bytes 
	 * @param unsigned? 
	 * @return  
	 */
	fromBytesLE(bytes : Long.FromBytesLE0, unsigned? : boolean): Long;
		
	/**
	 * Creates a Long from its big endian byte representation.
	 * @param {!Array.<number>} bytes Big endian byte representation
	 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
	 * @returns {Long} The corresponding Long value
	 * @param bytes 
	 * @param unsigned? 
	 * @return  
	 */
	fromBytesBE(bytes : Long.FromBytesBE0, unsigned? : boolean): Long;
		
	/**
	 * The low 32 bits as a signed value.
	 * @type {number}
	 */
	low : number;
		
	/**
	 * The high 32 bits as a signed value.
	 * @type {number}
	 */
	high : number;
}

/**
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 * @inner
 * @param obj 
 * @return  
 */
declare function isLong(obj : any): boolean;

/**
 * A cache of the Long representations of small integer values.
 * @type {!Object}
 * @inner
 */
declare var INT_CACHE : {
}

/**
 * A cache of the Long representations of small unsigned integer values.
 * @type {!Object}
 * @inner
 */
declare var UINT_CACHE : {
}

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 * @param value 
 * @param unsigned? 
 * @return  
 */
declare function fromInt(value : number, unsigned? : boolean): Long;

/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 * @param value 
 * @param unsigned? 
 * @return  
 */
declare function fromNumber(value : any, unsigned? : boolean): Long;

/**
 * @param {number} lowBits
 * @param {number} highBits
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 * @param lowBits 
 * @param highBits 
 * @param unsigned? 
 * @return  
 */
declare function fromBits(lowBits : number, highBits : number, unsigned? : boolean | number): Long;

/**
 * @function
 * @param {number} base
 * @param {number} exponent
 * @returns {number}
 * @inner
 * @param undefined 
 * @param undefined 
 * @return  
 */
declare function pow_dbl(param1 : number, param2 : number): number;

/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Long}
 * @inner
 * @param str 
 * @param unsigned? 
 * @param radix? 
 * @return  
 */
declare function fromString(str : any, unsigned? : boolean | number, radix? : boolean | number): any;
/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Long}
 * @inner
 */
declare function fromString();

/**
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 * @param val 
 * @param unsigned? 
 * @return  
 */
declare function fromValue(val : any, unsigned? : boolean): Long;
/**
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */
declare function fromValue();

/**
 * @type {number}
 * @const
 * @inner
 */
export declare var TWO_PWR_16_DBL : number;

/**
 * @type {number}
 * @const
 * @inner
 */
export declare var TWO_PWR_24_DBL : number;

/**
 * @type {number}
 * @const
 * @inner
 */
export declare var TWO_PWR_32_DBL : number;

/**
 * @type {number}
 * @const
 * @inner
 */
export declare var TWO_PWR_64_DBL : number;

/**
 * @type {number}
 * @const
 * @inner
 */
export declare var TWO_PWR_63_DBL : number;

/**
 * @type {!Long}
 * @const
 * @inner
 */
export declare var TWO_PWR_24 : Long;

/**
 * @alias Long.prototype
 * @inner
 */
declare namespace LongPrototype{
		
	/**
	 * 
	 */
	export var __isLong__ : boolean;
		
	/**
	 * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
	 * @this {!Long}
	 * @returns {number}
	 * @return  
	 */
	function toInt(): /* !this.low */ any;
		
	/**
	 * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
	 * @this {!Long}
	 * @returns {number}
	 * @return  
	 */
	function toNumber(): number;
		
	/**
	 * Gets the high 32 bits as a signed integer.
	 * @this {!Long}
	 * @returns {number} Signed high bits
	 * @return  
	 */
	function getHighBits(): /* !this.high */ any;
		
	/**
	 * Gets the high 32 bits as an unsigned integer.
	 * @this {!Long}
	 * @returns {number} Unsigned high bits
	 * @return  
	 */
	function getHighBitsUnsigned(): number;
		
	/**
	 * Gets the low 32 bits as a signed integer.
	 * @this {!Long}
	 * @returns {number} Signed low bits
	 * @return  
	 */
	function getLowBits(): /* !this.low */ any;
		
	/**
	 * Gets the low 32 bits as an unsigned integer.
	 * @this {!Long}
	 * @returns {number} Unsigned low bits
	 * @return  
	 */
	function getLowBitsUnsigned(): number;
		
	/**
	 * Gets the number of bits needed to represent the absolute value of this Long.
	 * @this {!Long}
	 * @returns {number}
	 * @return  
	 */
	function getNumBitsAbs(): number;
		
	/**
	 * Tests if this Long's value equals zero.
	 * @this {!Long}
	 * @returns {boolean}
	 * @return  
	 */
	function isZero(): boolean;
		
	/**
	 * Tests if this Long's value is negative.
	 * @this {!Long}
	 * @returns {boolean}
	 * @return  
	 */
	function isNegative(): boolean;
		
	/**
	 * Tests if this Long's value is positive.
	 * @this {!Long}
	 * @returns {boolean}
	 * @return  
	 */
	function isPositive(): /* !this.unsigned */ any;
		
	/**
	 * Tests if this Long's value is odd.
	 * @this {!Long}
	 * @returns {boolean}
	 * @return  
	 */
	function isOdd(): boolean;
		
	/**
	 * Tests if this Long's value is even.
	 * @this {!Long}
	 * @returns {boolean}
	 * @return  
	 */
	function isEven(): boolean;
		
	/**
	 * Tests if this Long's value equals the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function equals(other : any): boolean;
		
	/**
	 * Tests if this Long's value differs from the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function notEquals(other : any): boolean;
		
	/**
	 * Tests if this Long's value is less than the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function lessThan(other : any): boolean;
		
	/**
	 * Tests if this Long's value is less than or equal the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function lessThanOrEqual(other : any): boolean;
		
	/**
	 * Tests if this Long's value is greater than the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function greaterThan(other : any): boolean;
		
	/**
	 * Tests if this Long's value is greater than or equal the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {boolean}
	 * @param other 
	 * @return  
	 */
	function greaterThanOrEqual(other : any): boolean;
		
	/**
	 * Compares this Long's value with the specified's.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other value
	 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
	 *  if the given one is greater
	 * @param other 
	 * @return  
	 */
	function compare(other : any): number;
		
	/**
	 * Negates this Long's value.
	 * @this {!Long}
	 * @returns {!Long} Negated Long
	 * @return  
	 */
	function negate(): Long;
		
	/**
	 * Returns the sum of this and the specified Long.
	 * @this {!Long}
	 * @param {!Long|number|string} addend Addend
	 * @returns {!Long} Sum
	 * @param addend 
	 * @return  
	 */
	function add(addend : any): Long;
		
	/**
	 * Returns the difference of this and the specified Long.
	 * @this {!Long}
	 * @param {!Long|number|string} subtrahend Subtrahend
	 * @returns {!Long} Difference
	 * @param subtrahend 
	 * @return  
	 */
	function subtract(subtrahend : any): Long;
		
	/**
	 * Returns the product of this and the specified Long.
	 * @this {!Long}
	 * @param {!Long|number|string} multiplier Multiplier
	 * @returns {!Long} Product
	 * @param multiplier 
	 * @return  
	 */
	function multiply(multiplier : any): Long;
		
	/**
	 * Returns this Long divided by the specified. The result is signed if this Long is signed or
	 *  unsigned if this Long is unsigned.
	 * @this {!Long}
	 * @param {!Long|number|string} divisor Divisor
	 * @returns {!Long} Quotient
	 * @param divisor 
	 * @return  
	 */
	function divide(divisor : any): /* !this */ any;
		
	/**
	 * Returns this Long modulo the specified.
	 * @this {!Long}
	 * @param {!Long|number|string} divisor Divisor
	 * @returns {!Long} Remainder
	 * @param divisor 
	 * @return  
	 */
	function modulo(divisor : any): Long;
		
	/**
	 * Returns the bitwise NOT of this Long.
	 * @this {!Long}
	 * @returns {!Long}
	 * @return  
	 */
	function not(): Long;
		
	/**
	 * Returns the bitwise AND of this Long and the specified.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other Long
	 * @returns {!Long}
	 * @param other 
	 * @return  
	 */
	function and(other : any): Long;
		
	/**
	 * Returns the bitwise OR of this Long and the specified.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other Long
	 * @returns {!Long}
	 * @param other 
	 * @return  
	 */
	function or(other : any): Long;
		
	/**
	 * Returns the bitwise XOR of this Long and the given one.
	 * @this {!Long}
	 * @param {!Long|number|string} other Other Long
	 * @returns {!Long}
	 * @param other 
	 * @return  
	 */
	function xor(other : any): Long;
		
	/**
	 * Returns this Long with bits shifted to the left by the given amount.
	 * @this {!Long}
	 * @param {number|!Long} numBits Number of bits
	 * @returns {!Long} Shifted Long
	 * @param numBits 
	 * @return  
	 */
	function shiftLeft(numBits : number | Long): /* !this */ any;
		
	/**
	 * Returns this Long with bits arithmetically shifted to the right by the given amount.
	 * @this {!Long}
	 * @param {number|!Long} numBits Number of bits
	 * @returns {!Long} Shifted Long
	 * @param numBits 
	 * @return  
	 */
	function shiftRight(numBits : number | Long): /* !this */ any;
		
	/**
	 * Returns this Long with bits logically shifted to the right by the given amount.
	 * @this {!Long}
	 * @param {number|!Long} numBits Number of bits
	 * @returns {!Long} Shifted Long
	 * @param numBits 
	 * @return  
	 */
	function shiftRightUnsigned(numBits : number | Long): /* !this */ any;
		
	/**
	 * Returns this Long with bits rotated to the left by the given amount.
	 * @this {!Long}
	 * @param {number|!Long} numBits Number of bits
	 * @returns {!Long} Rotated Long
	 * @param numBits 
	 * @return  
	 */
	function rotateLeft(numBits : number | Long): /* !this */ any;
		
	/**
	 * Returns this Long with bits rotated to the right by the given amount.
	 * @this {!Long}
	 * @param {number|!Long} numBits Number of bits
	 * @returns {!Long} Rotated Long
	 * @param numBits 
	 * @return  
	 */
	function rotateRight(numBits : number | Long): /* !this */ any;
		
	/**
	 * Converts this Long to signed.
	 * @this {!Long}
	 * @returns {!Long} Signed long
	 * @return  
	 */
	function toSigned(): /* !this */ any;
		
	/**
	 * Converts this Long to unsigned.
	 * @this {!Long}
	 * @returns {!Long} Unsigned long
	 * @return  
	 */
	function toUnsigned(): /* !this */ any;
		
	/**
	 * Converts this Long to its byte representation.
	 * @param {boolean=} le Whether little or big endian, defaults to big endian
	 * @this {!Long}
	 * @returns {!Array.<number>} Byte representation
	 * @param le? 
	 * @return  
	 */
	function toBytes(le? : boolean): LongPrototype.ToBytesRet;
		
	/**
	 * Converts this Long to its little endian byte representation.
	 * @this {!Long}
	 * @returns {!Array.<number>} Little endian byte representation
	 * @return  
	 */
	function toBytesLE(): LongPrototype.ToBytesLERet;
		
	/**
	 * Converts this Long to its big endian byte representation.
	 * @this {!Long}
	 * @returns {!Array.<number>} Big endian byte representation
	 * @return  
	 */
	function toBytesBE(): LongPrototype.ToBytesBERet;
		
	/**
	 * 
	 */
	export var eqz : /* LongPrototype.isZero */ any;
		
	/**
	 * 
	 */
	export var eq : /* LongPrototype.equals */ any;
		
	/**
	 * 
	 */
	export var neq : /* LongPrototype.notEquals */ any;
		
	/**
	 * 
	 */
	export var ne : /* LongPrototype.notEquals */ any;
		
	/**
	 * 
	 */
	export var lt : /* LongPrototype.lessThan */ any;
		
	/**
	 * 
	 */
	export var lte : /* LongPrototype.lessThanOrEqual */ any;
		
	/**
	 * 
	 */
	export var le : /* LongPrototype.lessThanOrEqual */ any;
		
	/**
	 * 
	 */
	export var gt : /* LongPrototype.greaterThan */ any;
		
	/**
	 * 
	 */
	export var gte : /* LongPrototype.greaterThanOrEqual */ any;
		
	/**
	 * 
	 */
	export var ge : /* LongPrototype.greaterThanOrEqual */ any;
		
	/**
	 * 
	 */
	export var comp : /* LongPrototype.compare */ any;
		
	/**
	 * 
	 */
	export var neg : /* LongPrototype.negate */ any;
		
	/**
	 * 
	 */
	export var sub : /* LongPrototype.subtract */ any;
		
	/**
	 * 
	 */
	export var mul : /* LongPrototype.multiply */ any;
		
	/**
	 * 
	 */
	export var div : /* LongPrototype.divide */ any;
		
	/**
	 * 
	 */
	export var mod : /* LongPrototype.modulo */ any;
		
	/**
	 * 
	 */
	export var rem : /* LongPrototype.modulo */ any;
		
	/**
	 * 
	 */
	export var shl : /* LongPrototype.shiftLeft */ any;
		
	/**
	 * 
	 */
	export var shr : /* LongPrototype.shiftRight */ any;
		
	/**
	 * 
	 */
	export var shru : /* LongPrototype.shiftRightUnsigned */ any;
		
	/**
	 * 
	 */
	export var shr_u : /* LongPrototype.shiftRightUnsigned */ any;
		
	/**
	 * 
	 */
	export var rotl : /* LongPrototype.rotateLeft */ any;
		
	/**
	 * 
	 */
	export var rotr : /* LongPrototype.rotateRight */ any;
}

/**
 * 
 */
export declare var ZERO : Long;

/**
 * 
 */
export declare var UZERO : Long;

/**
 * 
 */
export declare var ONE : Long;

/**
 * 
 */
export declare var UONE : Long;

/**
 * 
 */
export declare var NEG_ONE : Long;

/**
 * 
 */
export declare var MAX_VALUE : Long;

/**
 * 
 */
export declare var MAX_UNSIGNED_VALUE : Long;

/**
 * 
 */
export declare var MIN_VALUE : Long;
