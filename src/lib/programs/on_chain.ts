/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/on_chain.json`.
 */
export type OnChain = {
  "address": "6hPPwfMV5yMR6pCvg1kt2JaAT5FSRjnefuYQ74s62XLL",
  "metadata": {
    "name": "onChain",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initializeBond",
      "docs": [
        "Initializes a new bond account with specified details.",
        "This function sets up the initial state of a funding bond."
      ],
      "discriminator": [
        135,
        182,
        183,
        104,
        169,
        38,
        102,
        147
      ],
      "accounts": [
        {
          "name": "bondAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "issuer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "purpose",
          "type": "string"
        },
        {
          "name": "sector",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferBond",
      "docs": [
        "Transfers the authority of a bond to a new owner.",
        "Only the current authority can perform this action."
      ],
      "discriminator": [
        0,
        46,
        163,
        201,
        117,
        252,
        130,
        26
      ],
      "accounts": [
        {
          "name": "bondAccount",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "bondAccount"
          ]
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bondAccount",
      "discriminator": [
        140,
        228,
        237,
        10,
        239,
        187,
        187,
        64
      ]
    }
  ],
  "types": [
    {
      "name": "bondAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The public key of the current owner/controller of the bond."
            ],
            "type": "pubkey"
          },
          {
            "name": "purpose",
            "docs": [
              "A description of what the funds are for."
            ],
            "type": "string"
          },
          {
            "name": "sector",
            "docs": [
              "The sector the funding belongs to (e.g., Healthcare, Education)."
            ],
            "type": "string"
          },
          {
            "name": "amount",
            "docs": [
              "The monetary value or amount of the bond."
            ],
            "type": "u64"
          },
          {
            "name": "isRedeemed",
            "docs": [
              "A flag to indicate if the bond has been redeemed."
            ],
            "type": "bool"
          }
        ]
      }
    }
  ]
};
