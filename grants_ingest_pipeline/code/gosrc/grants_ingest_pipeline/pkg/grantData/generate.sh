wget -q -O schema.xsd https://apply07.grants.gov/apply/system/schemas/OpportunityDetail-V1.0.xsd &&\
xsdgen -o generated.go -pkg grantData schema.xsd &&\
sed -i '' -e 's?http://apply.grants.gov/system/OpportunityDetail-V1.0\ ??g' generated.go
