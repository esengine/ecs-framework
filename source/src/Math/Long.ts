declare interface Long {
    toInt(): number;
    negate(): Long;
    add(addend);
    divide(divisor): Long;
    equals(other);
    not();
    toString(radix): string;
    isZero();
    isNegative();
    multiply(multiplier): Long;
    shiftRight(numBits);
    shiftRightUnsigned(numBits);
    subtract(subtrahend): Long;
    greaterThan(other);
    compare(other);
    toUnsigned(): Long;
    toNumber();
    greaterThanOrEqual(other);
    isOdd();
    lessThan(other);
}

class Long {
    public low: number;
    public high: number;
    public unsigned: boolean;

    private static ini_cache = {};
    private static unit_cache = {};
    public static uzero = Long.fromInt(0, true);
    public static zero = Long.fromInt(0);
    public static two_pwr_16_dbl = 1 << 16;
    public static two_pwe_24_dbl = 1 << 24;
    public static two_pwr_32_dbl = Long.two_pwr_16_dbl * Long.two_pwr_16_dbl;
    public static two_pwr_64_dbl = Long.two_pwr_32_dbl * Long.two_pwr_32_dbl;
    public static two_pwr_63_dbl = Long.two_pwr_64_dbl / 2;
    public static two_pwr_24 = Long.fromInt(Long.two_pwe_24_dbl);
    public static max_unsigned_value = Long.fromBits(0xFFFFFFFF|0, 0xFFFFFFFF|0, true);
    public static min_value = Long.fromBits(0, 0x80000000|0, false);
    public static max_value = Long.fromBits(0xFFFFFFFF|0, 0x7FFFFFFF|0, false);
    public static one = Long.fromInt(1);
    public static neg_one = Long.fromInt(-1);

    constructor(low: number, high: number, unsigned: boolean = true){
        this.low = low | 0;
        this.high = high | 0;
        this.unsigned = !!unsigned;
    }

    public shiftLeft(numBits: number | Long): Long{
        if (numBits instanceof Long)
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if(numBits < 32)
            return Long.fromBits(this.low << numBits, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return Long.fromBits(0, this.low << (numBits - 32), this.unsigned);
    }

    public static fromBits(lowBits, highBits, unsigned){
        return new Long(lowBits, highBits, unsigned);
    }

    public static fromValue(val: number | string | {low: number, high: number, unsigned: boolean}, unsigned?): Long{
        if (typeof val === 'number')
            return this.fromNumber(val, unsigned);
        if (typeof val === 'string')
            return this.fromString(val, unsigned);

        return this.fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
    }

    public static fromString(str: string, unsigned, radix?): Long{
        if (str.length === 0)
            throw new Error("empty string");
        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return Long.zero;
        if (typeof unsigned === "number"){
            radix = unsigned;
            unsigned = false;
        } else {
            unsigned = !! unsigned;
        }
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw new Error("radix");

        let p;
        if ((p = str.indexOf('-')) > 0)
            throw new Error('interior hyphen');
        else if(p === 0)
            return this.fromString(str.substring(1), unsigned, radix).negate();

        let radixToPower = this.fromNumber(Math.pow(radix, 8));
        let result = Long.zero;
        for (let i = 0; i < str.length; i += 8){
            let size = Math.min(8, str.length - i),
                value = parseInt(str.substring(i, i + size), radix);

            if(size < 8){
                let power = this.fromNumber(Math.pow(radix, size));
                result = result.multiply(power).add(this.fromNumber(value));
            } else {
                result = result.multiply(radixToPower);
                result = result.add(this.fromNumber(value));
            }
        }

        result.unsigned = unsigned;
        return result;
    }

    public static fromNumber(value, unsigned?): Long{
        if (isNaN(value))
            return unsigned ? Long.uzero : Long.zero;
        if (unsigned){
            if (value < 0)
                return Long.uzero;
            if (value >= Long.two_pwr_64_dbl)
                return Long.max_unsigned_value;
        }else {
            if (value <= -Long.two_pwr_63_dbl)
                return Long.min_value;
            if (value + 1 >= Long.two_pwr_63_dbl)
                return Long.max_value;
        }
        if (value < 0)
            return this.fromNumber(-value, unsigned).negate();
        return Long.fromBits((value % Long.two_pwr_32_dbl) | 0, (value / Long.two_pwr_32_dbl) | 0, unsigned);
    }

    public static fromInt(value, unsigned?): Long{
        let obj, cachedObj, cache;
        if (unsigned){
            value >>>= 0;
            if (cache = (0 <= value && value < 256)){
                cachedObj = this.unit_cache[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = this.fromBits(value, (value | 0) < 0 ? -1 : 0, true);
            if (cache)
                this.unit_cache[value] = obj;
            return obj;
        } else {
            value |= 0;
            if (cache = (-128 <= value && value < 128)){
                cachedObj = Long.ini_cache[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = this.fromBits(value, value < 0 ? -1 : 0, false);
            if (cache)
                Long.ini_cache[value] = obj;
            return obj;
        }
    }
}

Long.prototype.toInt = function(){
    let i = this as Long;
    return i.unsigned ? i.low >>> 0 : i.low;
}

Long.prototype.negate = function(){
    let i = this as Long;
    if (!i.unsigned && !i.equals(Long.min_value))
        return Long.min_value;
    return i.not().add(Long.one);
}

Long.prototype.add = function(addend: number | Long){
    let i = this as Long;
    if (typeof addend === "number"){
        addend = Long.fromValue(addend);
    }

    let a48 = i.high >>> 16;
    let a32 = i.high & 0xFFFF;
    let a16 = i.low >>> 16;
    let a00 = i.low & 0xFFFF;

    let b48 = addend.high >>> 16;
    let b32 = addend.high & 0xFFFF;
    let b16 = addend.low >>> 16;
    let b00 = addend.low & 0xFFFF;

    let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return Long.fromBits((c16 << 16) | c00, (c48 << 16) | 32, i.unsigned);
}

Long.prototype.equals = function(other: number | Long){
    let i = this as Long;
    if (typeof other === "number")
        other = Long.fromValue(other);
    if (i.unsigned !== other.unsigned && (i.high >>> 31) === 1 && (other.high >>> 31) === 1)
        return false;
    return i.high === other.high && i.low === other.low;
}

Long.prototype.not = function(){
    let i = this as Long;
    return Long.fromBits(~i.low, ~i.high, i.unsigned);
}

Long.prototype.toString = function(radix){
    let i = this as Long;
    radix = radix || 10;
    if (radix < 2 || 36 < radix)
        throw new Error("radix");
    if (i.isZero())
        return "0";
    if (i.isNegative()){
        if (i.equals(Long.min_value)){
            let radixLong = Long.fromNumber(radix),
                div = i.divide(radixLong),
                rem1 = div.multiply(radixLong).subtract(i);
            return div.toString(radix) + rem1.toInt().toString(radix);
        } else{
            return "-" + i.negate().toString(radix);
        }
    }

    let radixToPower = Long.fromNumber(Math.pow(radix, 6), i.unsigned),
        rem = i;
    let result = '';
    while (true) {
        let remDiv = rem.divide(radixToPower),
            intval = rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0,
            digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero())
            return digits + result;
        else {
            while (digits.length < 6)
                digits = '0' + digits;
            result = '' + digits + result;
        }
    }
}

Long.prototype.isZero = function(){
    let i = this as Long;
    return i.high === 0 && i.low === 0;
}

Long.prototype.isNegative = function(){
    let i = this as Long;
    return !i.unsigned && i.high < 0;
}

Long.prototype.divide = function(divisor: number | Long){
    let i = this as Long;
    if (typeof divisor === 'number')
        divisor = Long.fromValue(divisor);
    if (divisor.isZero())
        throw new Error("division by zero");

    if (i.isZero())
        return i.unsigned ? Long.uzero : Long.zero;
    let approx, rem: Long, res;
    if (!i.unsigned) {
        if (i.equals(Long.min_value)) {
            if (divisor.equals(Long.one) || divisor.equals(Long.neg_one))
                return Long.min_value;
            else if (divisor.equals(Long.min_value))
                return Long.one;
            else {
                var halfThis = i.shiftRight(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(Long.zero)) {
                    return divisor.isNegative() ? Long.one : Long.neg_one;
                } else {
                    rem = i.subtract(divisor.multiply(approx));
                    res = approx.add(rem.divide(divisor));
                    return res;
                }
            }
        } else if (divisor.equals(Long.min_value))
            return i.unsigned ? Long.uzero : Long.zero;
        if (i.isNegative()) {
            if (divisor.isNegative())
                return i.negate().divide(divisor.negate());
            return i.negate().divide(divisor).negate();
        } else if (divisor.isNegative())
            return this.div(divisor.negate()).neg();
        res = Long.zero;
    } else {
        if (!divisor.unsigned)
            divisor = divisor.toUnsigned();
        if (divisor.greaterThan(i))
            return Long.uzero;
        if (divisor.greaterThan(i.shiftRightUnsigned(1)))
            return Long.uzero;
        res = Long.uzero;
    }

    rem = i;
    while (rem.greaterThanOrEqual(divisor)) {
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

        let log2 = Math.ceil(Math.log(approx) / Math.LN2),
            delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48),
            approxRes = Long.fromNumber(approx),
            approxRem = approxRes.multiply(divisor);
        while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
            approx -= delta;
            approxRes = Long.fromNumber(approx, this.unsigned);
            approxRem = approxRes.multiply(divisor);
        }

        if (approxRes.isZero())
            approxRes = Long.one;

        res = res.add(approxRes);
        rem = rem.subtract(approxRem);
    }
    return res;
}

Long.prototype.shiftRight = function(numBits: number | Long){
    let i = this as Long;
    if (numBits instanceof Long){
        numBits = numBits.toInt();
    }
    if ((numBits &= 63) === 0)
        return i;
    else if(numBits < 32)
        return Long.fromBits((i.low >>> numBits) | (i.high << (32 - numBits)), i.high >> numBits, i.unsigned);
    else
        return Long.fromBits(i.high >> (numBits - 32), i.high >= 0 ? 0 : -1, i.unsigned);
}

Long.prototype.shiftRightUnsigned = function(numBits: number | Long){
    let i = this as Long;
    if (numBits instanceof Long)
        numBits = numBits.toInt();
    if ((numBits &= 63) === 0) return i;
    if (numBits < 32) return Long.fromBits((i.low >>> numBits) | (i.high << (32 - numBits)), i.high >>> numBits, i.unsigned);
    if (numBits === 32) return Long.fromBits(i.high, 0, i.unsigned);
    return Long.fromBits(i.high >>> (numBits - 32), 0, i.unsigned);
}

Long.prototype.subtract = function(subtrahend: number | Long){
    let i = this as Long;
    if (typeof subtrahend === "number")
        subtrahend = Long.fromValue(subtrahend);
    return i.add((subtrahend as Long).negate());
}

Long.prototype.greaterThan = function(other){
    let i = this as Long;
    return i.compare(other) > 0;
}

Long.prototype.compare = function(other: number | Long){
    let i = this as Long;
    if (typeof (other) === "number")
        other = Long.fromValue(other);
    if (i.equals(other))
        return 0;
    let thisNeg = i.isNegative(),
        otherNeg = other.isNegative();
    if (thisNeg && !otherNeg)
        return -1;
    if (!thisNeg && otherNeg)
        return 1;
    if (!i.unsigned)
        return i.subtract(other).isNegative() ? -1 : 1;
    return (other.high >>> 0) > (i.high >>> 0) || (other.high === i.high && (other.low >>> 0) > (i.low >>> 0)) ? -1 : 1;
}

Long.prototype.toUnsigned = function(){
    let i = this as Long;
    if (i.unsigned)
        return i;
    return Long.fromBits(i.low, i.high, true);
}

Long.prototype.toNumber = function(){
    let i = this as Long;
    if (i.unsigned)
        return ((i.high >>> 0) * Long.two_pwr_32_dbl) + (i.low >>> 0);
    return i.high * Long.two_pwr_32_dbl + (i.low >>> 0);
}

Long.prototype.greaterThanOrEqual = function(other){
    let i = this as Long;
    return i.compare(other) >= 0;
}

Long.prototype.multiply = function(multiplier: number | Long){
    let i = this as Long;
    if (i.isZero())
        return Long.zero;
    if (typeof multiplier === "number")
        multiplier = Long.fromValue(multiplier);

    if (multiplier.isZero())
        return Long.zero;
    if (i.equals(Long.min_value))
        return multiplier.isOdd() ? Long.min_value : Long.zero;
    if (multiplier.equals(Long.min_value))
        return i.isOdd() ? Long.min_value : Long.zero;

    if (i.isNegative()){
        if (multiplier.isNegative())
            return i.negate().multiply(multiplier.negate());
        else
            return i.negate().multiply(multiplier).negate();
    } else if(multiplier.isNegative())
        return i.multiply(multiplier.negate()).negate();

    if (i.lessThan(Long.two_pwr_24) && multiplier.lessThan(Long.two_pwr_24))
        return Long.fromNumber(i.toNumber() * multiplier.toNumber(), i.unsigned);

    let a48 = i.high >>> 16;
    let a32 = i.high & 0xFFFF;
    let a16 = i.low >>> 16;
    let a00 = i.low & 0xFFFF;

    let b48 = multiplier.high >>> 16;
    let b32 = multiplier.high & 0xFFFF;
    let b16 = multiplier.low >>> 16;
    let b00 = multiplier.low & 0xFFFF;

    let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, i.unsigned);
    
}

Long.prototype.isOdd = function(){
    let i = this as Long;
    return (i.low & 1) === 1;
}

Long.prototype.lessThan = function(other: Long){
    let i = this as Long;
    return i.compare(other) < 0;
}