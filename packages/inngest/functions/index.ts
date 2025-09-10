import { exampleEffect } from './exampleEffect';
import { userSignedIn } from './userSignedIn';
import { walletPassUpdate } from './wallet-pass-update';

export const functions = [userSignedIn, exampleEffect, walletPassUpdate];
