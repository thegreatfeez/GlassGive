import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import GlassGiveCampaignABI from '../abis/GlassGiveCampaign.json';

export function useCampaign(contractAddress?: `0x${string}`) {
  const { address } = useAccount();
  const { 
    writeContract, 
    data: hash, 
    error: writeError, 
    isPending: isWritePending 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const donate = async (amountHbar: string) => {
    if (!contractAddress) return;

    writeContract({
      address: contractAddress,
      abi: GlassGiveCampaignABI,
      functionName: 'donate',
      value: parseEther(amountHbar),
    });
  };

  const releaseFunds = async () => {
    if (!contractAddress) return;

    writeContract({
      address: contractAddress,
      abi: GlassGiveCampaignABI,
      functionName: 'releaseFunds',
    });
  };

  const withdraw = async () => {
    if (!contractAddress) return;

    writeContract({
      address: contractAddress,
      abi: GlassGiveCampaignABI,
      functionName: 'withdraw',
    });
  };

  // View functions
  const { data: totalRaised, refetch: refetchRaised } = useReadContract({
    address: contractAddress,
    abi: GlassGiveCampaignABI,
    functionName: 'totalRaised',
  });

  const { data: deadline } = useReadContract({
    address: contractAddress,
    abi: GlassGiveCampaignABI,
    functionName: 'deadline',
  });

  const { data: isReleased, refetch: refetchReleased } = useReadContract({
    address: contractAddress,
    abi: GlassGiveCampaignABI,
    functionName: 'released',
  });

  const { data: pendingWithdrawal, refetch: refetchPending } = useReadContract({
    address: contractAddress,
    abi: GlassGiveCampaignABI,
    functionName: 'pendingWithdrawals',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  return {
    donate,
    releaseFunds,
    withdraw,
    hash,
    isPending: isWritePending || isConfirming,
    isConfirmed,
    error: writeError || confirmError,
    totalRaised,
    deadline,
    isReleased,
    pendingWithdrawal,
    refetchAll: () => {
      refetchRaised();
      refetchReleased();
      refetchPending();
    }
  };
}
