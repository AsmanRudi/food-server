import { useEffect, useState } from "react";

import {
    Plus,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import { toast } from "sonner";
import RegionAddressFields from "../components/address/RegionAddressFields";
import { getPaymentOptions } from "../services/payment.service";

import {
    createAddress,
    getAddresses,
} from "../services/address.service";

import {
    createOrder,
} from "../services/order.service";

import {
    useCartStore,
} from "../store/cartStore";

import {
    formatRupiah,
} from "../utils/format";

const DELIVERY_FEE = 10000;
const paymentMethods = [
  { id: "cod", label: "Bayar di tempat", description: "Bayar tunai kepada kurir saat pesanan diterima." },
  { id: "bank_transfer", label: "Transfer bank", description: "Transfer ke rekening toko. Admin akan mengonfirmasi pembayaran." },
  { id: "midtrans", label: "Midtrans", description: "Bayar melalui halaman pembayaran Midtrans." },
];

const Checkout = () => {
  const navigate = useNavigate();

  const items = useCartStore(
    (state) => state.items
  );

  const getTotal = useCartStore(
    (state) => state.getTotal
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const [addresses, setAddresses] =
    useState([]);

  const [selectedAddress, setSelectedAddress] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [addressForm, setAddressForm] =
    useState({
      name: "",
      provinsi: "",
      kabupaten: "",
      kecamatan: "",
      kelurahan: "",
      detail: "",
    });

  const [loading, setLoading] =
    useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentOptions, setPaymentOptions] = useState({
    cod: { enabled: true },
    bank_transfer: { enabled: false },
    midtrans: { enabled: false },
  });

  const subtotal = getTotal();

  useEffect(() => {
    let active = true;
    getAddresses()
      .then((result) => {
        if (active) setAddresses(result.data || []);
      })
      .catch(() => {
        if (active) toast.error("Gagal mengambil alamat");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    getPaymentOptions()
      .then(setPaymentOptions)
      .catch(() => toast.error("Gagal mengambil metode pembayaran"));
  }, []);

  const handleCreateAddress =
    async (e) => {
      e.preventDefault();

      try {
        const address =
          await createAddress(
            addressForm
          );

        setAddresses([
          ...addresses,
          address,
        ]);

        setSelectedAddress(
          address._id
        );

        setShowForm(false);

        setAddressForm({
          name: "",
          provinsi: "",
          kabupaten: "",
          kecamatan: "",
          kelurahan: "",
          detail: "",
        });

        toast.success(
          "Alamat berhasil ditambahkan"
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          "Gagal membuat alamat"
        );
      }
    };

  const handleOrder = async () => {
    if (!selectedAddress) {
      toast.error(
        "Pilih alamat pengiriman"
      );

      return;
    }

    try {
      setLoading(true);

      const order =
        await createOrder({
          delivery_fee:
            DELIVERY_FEE,

          delivery_address:
            selectedAddress,
          payment_method: paymentMethod,
        });

      clearCart();

      if (order.payment_url) {
        window.location.assign(order.payment_url);
        return;
      }

      toast.success(
        "Pesanan berhasil dibuat"
      );

      navigate(
        `/orders/${order._id}`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Gagal membuat pesanan"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    navigate("/cart");

    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      <h1 className="text-4xl font-black">
        Checkout
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">

        <div className="space-y-6">

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-black">
                Alamat Pengiriman
              </h2>

              <button
                onClick={() =>
                  setShowForm(
                    !showForm
                  )
                }
                className="flex items-center gap-1 font-semibold text-orange-500"
              >
                <Plus size={18} />
                Tambah
              </button>

            </div>

            {showForm && (
              <form
                onSubmit={
                  handleCreateAddress
                }
                className="mt-6 grid gap-4 md:grid-cols-2"
              >

                <input
                  name="name"
                  autoComplete="address-line1"
                  required
                  placeholder="Nama Alamat"
                  value={addressForm.name}
                  onChange={(event) =>
                    setAddressForm({
                      ...addressForm,
                      name: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                />

                <RegionAddressFields
                  value={addressForm}
                  onChange={(field, value) =>
                    setAddressForm((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                />

                <textarea
                  required
                  placeholder="Detail alamat"
                  value={
                    addressForm.detail
                  }
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      detail:
                        e.target.value,
                    })
                  }
                  className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-500"
                  rows="3"
                />

                <button
                  type="submit"
                  className="md:col-span-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white"
                >
                  Simpan Alamat
                </button>

              </form>
            )}

            <div className="mt-6 space-y-3">

              {addresses.map(
                (address) => (
                  <label
                    key={address._id}
                    className={`block cursor-pointer rounded-xl border p-4 ${
                      selectedAddress ===
                      address._id
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200"
                    }`}
                  >

                    <div className="flex gap-3">

                      <input
                        type="radio"
                        name="address"
                        checked={
                          selectedAddress ===
                          address._id
                        }
                        onChange={() =>
                          setSelectedAddress(
                            address._id
                          )
                        }
                      />

                      <div>

                        <p className="font-bold">
                          {address.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {address.detail},{" "}
                          {address.kelurahan},{" "}
                          {address.kecamatan},{" "}
                          {address.kabupaten},{" "}
                          {address.provinsi}
                        </p>

                      </div>

                    </div>

                  </label>
                )
              )}

            </div>

          </div>

        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Ringkasan Pesanan
          </h2>

          <fieldset className="mt-6 space-y-3">
            <legend className="mb-3 font-bold">Metode Pembayaran</legend>
            {paymentMethods.map((method) => {
              const enabled = paymentOptions[method.id]?.enabled;
              return (
                <label
                  key={method.id}
                  className={`block rounded-xl border p-4 ${
                    paymentMethod === method.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200"
                  } ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      disabled={!enabled}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1 accent-orange-600"
                    />
                    <span>
                      <span className="block font-semibold">{method.label}</span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {enabled ? method.description : "Belum dikonfigurasi oleh admin."}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {paymentMethod === "bank_transfer" && paymentOptions.bank_transfer.enabled && (
            <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-slate-700">
              Transfer ke {paymentOptions.bank_transfer.bank} atas nama {paymentOptions.bank_transfer.account_name},
              nomor {paymentOptions.bank_transfer.account_number}.
            </div>
          )}

          <div className="mt-6 space-y-3">

            <div className="flex justify-between">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span>
                {formatRupiah(
                  subtotal
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">
                Ongkir
              </span>

              <span>
                {formatRupiah(
                  DELIVERY_FEE
                )}
              </span>
            </div>

            <div className="border-t pt-4">

              <div className="flex justify-between text-lg font-black">

                <span>Total</span>

                <span className="text-orange-500">
                  {formatRupiah(
                    subtotal +
                      DELIVERY_FEE
                  )}
                </span>

              </div>

            </div>

          </div>

          <button
            onClick={handleOrder}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : "Buat Pesanan"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default Checkout;