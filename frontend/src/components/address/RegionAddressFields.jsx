import { useEffect, useState } from "react";

const REGION_API = "https://www.emsifa.com/api-wilayah-indonesia/api";

const RegionAddressFields = ({ value, onChange }) => {
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    const [provinceId, setProvinceId] = useState("");
    const [regencyId, setRegencyId] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [loading, setLoading] = useState({ provinsi: true });
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${REGION_API}/provinces.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error("Wilayah tidak dapat dimuat");
                return response.json();
            })
            .then(setProvinces)
            .catch((requestError) => {
                if (requestError.name !== "AbortError") setError("Daftar provinsi gagal dimuat.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading((current) => ({ ...current, provinsi: false }));
            });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!provinceId) return undefined;
        const controller = new AbortController();
        setLoading((current) => ({ ...current, kabupaten: true }));
        fetch(`${REGION_API}/regencies/${provinceId}.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error("Wilayah tidak dapat dimuat");
                return response.json();
            })
            .then(setRegencies)
            .catch((requestError) => {
                if (requestError.name !== "AbortError") setError("Daftar kabupaten/kota gagal dimuat.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading((current) => ({ ...current, kabupaten: false }));
            });
        return () => controller.abort();
    }, [provinceId]);

    useEffect(() => {
        if (!regencyId) return undefined;
        const controller = new AbortController();
        setLoading((current) => ({ ...current, kecamatan: true }));
        fetch(`${REGION_API}/districts/${regencyId}.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error("Wilayah tidak dapat dimuat");
                return response.json();
            })
            .then(setDistricts)
            .catch((requestError) => {
                if (requestError.name !== "AbortError") setError("Daftar kecamatan gagal dimuat.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading((current) => ({ ...current, kecamatan: false }));
            });
        return () => controller.abort();
    }, [regencyId]);

    useEffect(() => {
        if (!districtId) return undefined;
        const controller = new AbortController();
        setLoading((current) => ({ ...current, kelurahan: true }));
        fetch(`${REGION_API}/villages/${districtId}.json`, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error("Wilayah tidak dapat dimuat");
                return response.json();
            })
            .then(setVillages)
            .catch((requestError) => {
                if (requestError.name !== "AbortError") setError("Daftar kelurahan gagal dimuat.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading((current) => ({ ...current, kelurahan: false }));
            });
        return () => controller.abort();
    }, [districtId]);

    const resetBelow = (fields) => fields.forEach((field) => onChange(field, ""));

    const handleProvinceChange = (event) => {
        const selected = provinces.find((item) => item.id === event.target.value);
        setError("");
        setProvinceId(selected?.id || "");
        setRegencyId("");
        setDistrictId("");
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        onChange("provinsi", selected?.name || "");
        resetBelow(["kabupaten", "kecamatan", "kelurahan"]);
    };

    const handleRegencyChange = (event) => {
        const selected = regencies.find((item) => item.id === event.target.value);
        setRegencyId(selected?.id || "");
        setDistrictId("");
        setDistricts([]);
        setVillages([]);
        onChange("kabupaten", selected?.name || "");
        resetBelow(["kecamatan", "kelurahan"]);
    };

    const handleDistrictChange = (event) => {
        const selected = districts.find((item) => item.id === event.target.value);
        setDistrictId(selected?.id || "");
        setVillages([]);
        onChange("kecamatan", selected?.name || "");
        onChange("kelurahan", "");
    };

    const handleVillageChange = (event) => {
        const selected = villages.find((item) => item.id === event.target.value);
        onChange("kelurahan", selected?.name || "");
    };

    const fields = [
        { name: "provinsi", label: "Provinsi", options: provinces, selectedId: provinceId, handler: handleProvinceChange, placeholder: "Pilih provinsi", disabled: false },
        { name: "kabupaten", label: "Kabupaten / Kota", options: regencies, selectedId: regencyId, handler: handleRegencyChange, placeholder: "Pilih kabupaten/kota", disabled: !provinceId },
        { name: "kecamatan", label: "Kecamatan", options: districts, selectedId: districtId, handler: handleDistrictChange, placeholder: "Pilih kecamatan", disabled: !regencyId },
        { name: "kelurahan", label: "Kelurahan", options: villages, selectedId: value.kelurahan ? villages.find((item) => item.name === value.kelurahan)?.id || "" : "", handler: handleVillageChange, placeholder: "Pilih kelurahan", disabled: !districtId },
    ];

    return (
        <fieldset className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <legend className="sr-only">Wilayah alamat</legend>
            {fields.map((field) => (
                <label key={field.name} className="block text-sm font-medium text-slate-700">
                    {field.label}
                    <select
                        name={field.name}
                        value={field.selectedId}
                        onChange={field.handler}
                        disabled={field.disabled || loading[field.name] || field.options.length === 0}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">
                            {loading[field.name] ? "Memuat..." : field.placeholder}
                        </option>
                        {field.options.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                    </select>
                </label>
            ))}
            {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
        </fieldset>
    );
};

export default RegionAddressFields;