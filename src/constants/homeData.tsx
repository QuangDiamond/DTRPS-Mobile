// Mock data: replace via API adapter when backend is ready.
export type Destination = { id: string; name: string; location: string; rating: string; image: string };
export const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCyT-TmyX4gP_HY0QhZ1C17EkLE9WFNLvI7W4Oo-QXMM2xHsoLYpHMzNX_Qoj8gghkjRu8YyTMIxRniHDajLkPAaMluldqD2oKYPp4mDY5W2z-5obpDWNLN5tjj36Z8gSRntV-nnuqqs2ridDGpeOJoEwmWRH4tqOJkAb2MR7TniGX15JkTnPzzvObN4DnitAgEM4mzbOReKh2ccR7CNdqyTr_YimVQoa5ZRc1z3Uc1LDTiKpcThB1R1g";
export const popularDestinations: Destination[] = [
  {
    "id": "1",
    "name": "Vịnh Hạ Long",
    "location": "Quảng Ninh",
    "rating": "5.0",
    "image": "https://lh3.googleusercontent.com/aida/AEtjO1Ui9sv-mMyP-GlWmZUUlEDrbO64gQZ30NLS5xy699oUPG2cpC-ysSWD_R7l9T74usE6VZHfNLvIvGDwz8799dtFTA9TYZYxWprvAgdVrZVJEt6qnrnc0Umv68JaI84-wlECUdZx1wTNBGehghYqeBZN7elZBwhvKAHis7xyTZWtFM6A3HQsR7pY3Wjrb_GNqvG23SHCF7ucAm398QrJBGTGP9g3aYs0cl39ipflkAV_4HEInHtxb2CC_YaP"
  },
  {
    "id": "2",
    "name": "Hội An",
    "location": "Quảng Nam",
    "rating": "4.9",
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBjtVp-Efa5QIDASQnXvPdOscuM4XWLBiHNdc01uwlJFaKSJjvTEZp3rFe2mY8GXfuffObKZAHOz7ySllccv1HvH9D91cjZIi3nFAQa4-r29vpREkRgSgE80VEpnDOTHTG_VLlbJg63gYRZ_PcNlO3WwhOuu4OrJCHd01Iekh0gbafmmcu5PZpTBYfCcyqdqS56JWxdXIr-VnzHalKDZXYCCvaSTlR_qSWtLDgWgeJ4MmbWZCV_wfFDPw"
  },
  {
    "id": "3",
    "name": "Sa Pa",
    "location": "Lào Cai",
    "rating": "4.8",
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCNDamDf47oCedSTrvEp76ysnDJjOnYd2GGP5Dy_FL_ywvl8-CpynXN8yiW1lQwaDrcj6_yr_pNKrwwPUTvAi8dZabKXW_-ZjxzwE7ZSdBK_lvkTFye6OHrZ_tzs--YienEINGop-SngKvAX2Qx11BZxzJiDCjekRFAsvGbyceiaGy_nNRDJMuApUWZ8Zgat9r5fuhpgN4t1NYH5NFWA32-1M_-AmX6g0-AXdO0mxOAtI2gPE8AtYsaOw"
  }
];
export const suggestedPlaces: Destination[] = [
  {
    "id": "1",
    "name": "Chùa Một Cột",
    "location": "Ba Đình, Hà Nội",
    "rating": "4.8",
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCmSqi5kjv9G18OQ5Zn5Z6bcDSs8YtuzSbNBKb_575KVywf9ocxilCNmea-c3TwY6td9WB2ekgqtyPS0NzU8U3ImNoh7xaDDNOqaCs653iuisbR4lFIBb86_adEk0up43yv3FKSaTOVZMx7DYeoFn4ZTA5Liz8k0_mhRMRoAB5oB-_fE84GdxpTNIPgy6F1cIOkBfZkPg5sN_BpbAiwF4vC2TUjF_8awCUa2NF1FKvzgG1AKdjL_DW64w"
  },
  {
    "id": "2",
    "name": "Đại Nội Huế",
    "location": "TP. Huế, Thừa Thiên Huế",
    "rating": "4.9",
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuASOYWC8yz5hkeXN9pLYU7XYlIl8Lg-tVZZPRpzKlvaDBOYAAv_0V6jKGuzpdBFgEuMa3HpREb4GKxLOoS7y7QmfKZrOAZLC451mthjS5Od9DB7tPMswurFXb8yc6gRC3fidyJYLnieIlNmQGe5PvKCpCnP_AUYZNqD1-6NqVPo_1NcmbePVdvL43FxEbH9v-PXIObBCpgwL5e06n-TTIc1M8P9EAb18Vww-aO6WGTw5q1-YW7LI9yn3Q"
  },
  {
    "id": "3",
    "name": "Bãi Sao – Phú Quốc",
    "location": "An Thới, Kiên Giang",
    "rating": "4.8",
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCfz0ERWUcfzYuoBZn8jWIWwV-dUbwlxHJXO5p_V5DESikWCp40KBci6C40VkBXDiyPj1hw6lSqxFc6jo_XObb8h9yR_VJtj5BCkPBk6ND21eeFc-7Cjew4sTI-kc12FXy8-9ie79qd-V6Cs6u4k8L-T3fpo4dhnFA85byURqWSBe-hlRQ26CLbmLGX0lGiG90wRep2PcPJPA0PmsDWD8Dq-iLTALDsyjuUnOPif9QBy_ESe0g5k4DLKA"
  }
];
