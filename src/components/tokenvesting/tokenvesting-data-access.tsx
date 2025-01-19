'use client'

import { getTokenvestingProgram, getTokenvestingProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout' 
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

interface CreateTokenvestingArgs {
  companyName: string;
  mint: string;
}

interface CreateEmployeeArgs {
  startTime : number;
  endTime : number;
  totalAmount: number;
  cliffTime: number;
  beneficiary: string;
}

export function useTokenvestingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getTokenvestingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getTokenvestingProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['tokenvesting', 'all', { cluster }],
    queryFn: () => program.account.tokenvesting.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createTokenvestingAccount = useMutation<string , Error , CreateTokenvestingArgs>({
    mutationKey: ['tokenvestingAccount', 'create', { cluster }],
    mutationFn: ({companyName , mint}) =>
      program.methods
    .createTokenvestingAccount(companyName)
    .accounts({ mint: new PublicKey(mint) , tokenProgram: TOKEN_PROGRAM_ID})
    .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to create tokenVesting account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createTokenvestingAccount,
  }
}

export function useTokenvestingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useTokenvestingProgram()

  const accountQuery = useQuery({
    queryKey: ['tokenvesting', 'fetch', { cluster, account }],
    queryFn: () => program.account.tokenvestingAccount.fetch(account),
  })

  const createEmployeeAccount = useMutation<string , Error , CreateEmployeeArgs>({
    mutationKey: ['employeeAccount', 'create', { cluster }],
    mutationFn: ({startTime , endTime , totalAmount , cliffTime , beneficiary}) =>
      program.methods
    .createEmployeeAccount(startTime , endTime , totalAmount , cliffTime )
    .accounts({ beneficiary: new PublicKey(beneficiary) , tokenvestingAccount : account})
    .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to create tokenVesting account'),
  })

  return {
    accountQuery,
    createEmployeeAccount
  }
}
