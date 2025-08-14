/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/governance.json`.
 */
export type Governance = {
  "address": "HbD9TyCRmTboM3QuL2h227hEhzKBfL3CTgqtohtGKP92",
  "metadata": {
    "name": "governance",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addVerifiedUser",
      "docs": [
        "NEW INSTRUCTION: An admin can add a new verified user."
      ],
      "discriminator": [
        126,
        135,
        209,
        24,
        87,
        111,
        27,
        225
      ],
      "accounts": [
        {
          "name": "verifiedUser",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  100,
                  95,
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "userToVerify"
              }
            ]
          }
        },
        {
          "name": "userToVerify"
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "castVote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "voterBondAccount"
        },
        {
          "name": "voteRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "proposal.id",
                "account": "proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voteYes",
          "type": "bool"
        }
      ]
    },
    {
      "name": "createBondViaCpi",
      "discriminator": [
        229,
        18,
        126,
        249,
        71,
        120,
        203,
        141
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true,
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "newBondAccount",
          "writable": true
        },
        {
          "name": "onChainProgram",
          "address": "6hPPwfMV5yMR6pCvg1kt2JaAT5FSRjnefuYQ74s62XLL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createProposal",
      "docs": [
        "MODIFIED: Now requires the proposer to be verified."
      ],
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "governanceState",
          "writable": true
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "governance_state.proposal_count",
                "account": "governanceState"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "verifiedUser",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  101,
                  100,
                  95,
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "proposer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "bondPurpose",
          "type": "string"
        },
        {
          "name": "bondSector",
          "type": "string"
        },
        {
          "name": "bondAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeProposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "governanceState"
        }
      ],
      "args": []
    },
    {
      "name": "initializeGovernance",
      "discriminator": [
        171,
        87,
        101,
        237,
        27,
        107,
        201,
        57
      ],
      "accounts": [
        {
          "name": "governanceState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  111,
                  118,
                  101,
                  114,
                  110,
                  97,
                  110,
                  99,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
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
          "name": "votingPeriod",
          "type": "i64"
        },
        {
          "name": "quorumVotes",
          "type": "u64"
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
    },
    {
      "name": "governanceState",
      "discriminator": [
        29,
        155,
        54,
        196,
        179,
        215,
        224,
        121
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "verifiedUser",
      "discriminator": [
        197,
        144,
        184,
        72,
        82,
        65,
        99,
        144
      ]
    },
    {
      "name": "voteRecord",
      "discriminator": [
        112,
        9,
        123,
        165,
        234,
        9,
        157,
        167
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notBondHolder",
      "msg": "You are not a bond holder and cannot vote."
    },
    {
      "code": 6001,
      "name": "proposalNotActive",
      "msg": "This proposal is not active for voting."
    },
    {
      "code": 6002,
      "name": "votingPeriodEnded",
      "msg": "The voting period has ended for this proposal."
    },
    {
      "code": 6003,
      "name": "votingPeriodNotOver",
      "msg": "The voting period is not over yet."
    },
    {
      "code": 6004,
      "name": "voteFailed",
      "msg": "Proposal did not receive enough yes votes to pass."
    },
    {
      "code": 6005,
      "name": "quorumNotReached",
      "msg": "The minimum quorum of votes was not reached."
    },
    {
      "code": 6006,
      "name": "proposalNotSucceeded",
      "msg": "This proposal has not passed the vote yet."
    },
    {
      "code": 6007,
      "name": "userNotVerified",
      "msg": "The user creating the proposal is not verified."
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
    },
    {
      "name": "governanceState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "votingPeriod",
            "type": "i64"
          },
          {
            "name": "quorumVotes",
            "type": "u64"
          },
          {
            "name": "proposalCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "yesVotes",
            "type": "u64"
          },
          {
            "name": "noVotes",
            "type": "u64"
          },
          {
            "name": "startSlot",
            "type": "u64"
          },
          {
            "name": "endSlot",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "proposalState"
              }
            }
          },
          {
            "name": "bondPurpose",
            "type": "string"
          },
          {
            "name": "bondSector",
            "type": "string"
          },
          {
            "name": "bondAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "proposalState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "voting"
          },
          {
            "name": "succeeded"
          },
          {
            "name": "failed"
          },
          {
            "name": "executed"
          }
        ]
      }
    },
    {
      "name": "verifiedUser",
      "docs": [
        "NEW ACCOUNT to represent a verified user."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "isVerified",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voteRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "voter",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
