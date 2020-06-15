interface ITriggerListener {
    onTriggerEnter(other: Collider, local: Collider);
    onTriggerExit(other: Collider, local: Collider);
}