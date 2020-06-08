class Matcher{
    protected allSet = new BitSet();
    protected exclusionSet = new BitSet();
    protected oneSet = new BitSet();

    public static empty(){
        return new Matcher();
    }

    public IsIntersted(e: Entity){
        if (!this.allSet.isEmpty()){
            for (let i = this.allSet.nextSetBit(0); i >= 0; i = this.allSet.nextSetBit(i + 1)){
                if (!e.componentBits.get(i))
                    return false;
            }
        }

        if (!this.exclusionSet.isEmpty() && this.exclusionSet.intersects(e.componentBits))
            return false;

        if (!this.oneSet.isEmpty() && !this.oneSet.intersects(e.componentBits))
            return false;

        return true;
    }
}