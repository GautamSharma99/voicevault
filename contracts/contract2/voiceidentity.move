module VoiceVault::voice_identity {
    use std::signer;
    use std::string;
    use aptos_framework::timestamp;

    struct VoiceIdentity has key {
        owner: address,
        voice_id: u64,
        name: string::String,
        model_uri: string::String,
        rights: string::String,
        price_per_use: u64,
        created_at: u64
    }

    struct VoiceRegistry has key {
        counter: u64
    }

    public entry fun register_voice(
        creator: &signer,
        name: string::String,
        model_uri: string::String,
        rights: string::String,
        price_per_use: u64
    ) acquires VoiceRegistry {
        let reg = borrow_global_mut<VoiceRegistry>(signer::address_of(creator));
        let new_id = reg.counter;
        reg.counter = new_id + 1;
        move_to(
            creator,
            VoiceIdentity {
                owner: signer::address_of(creator),
                voice_id: new_id,
                name,
                model_uri,
                rights,
                price_per_use,
                created_at: timestamp::now_seconds()
            }
        );
    }

    public fun get_voice_id(owner: address): u64 acquires VoiceIdentity {
        borrow_global<VoiceIdentity>(owner).voice_id
    }

    public fun get_metadata(owner: address): (address, u64, string::String, string::String, string::String, u64, u64) acquires VoiceIdentity {
        let voice = borrow_global<VoiceIdentity>(owner);
        (
            voice.owner,
            voice.voice_id,
            voice.name,
            voice.model_uri,
            voice.rights,
            voice.price_per_use,
            voice.created_at
        )
    }
}